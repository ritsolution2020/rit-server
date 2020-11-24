const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Project = require('../models/project');
const {
  errorHandler
} = require('../helpers/dbErrorHandler');

exports.projectById = (req, res, next, id) => {
  Project.findById(id)
    .populate('category')
    .exec((err, project) => {
      if (err || !project) {
        return res.status(400).json({
          error: 'Project not found'
        });
      }
      req.project = project;
      next();
    });
};

exports.create = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded'
      });
    }
    // check for all fields
    const {
      name,
      link,
      description,
      category,

    } = fields;

    if (!name || !link ||  !description ||  !category ) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    let project = new Project(fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size'
        });
      }
      project.photo.data = fs.readFileSync(files.photo.path);
      project.photo.contentType = files.photo.type;
    }

    project.save((err, result) => {
      if (err) {
        // console.log('PROject CREATE ERROR ', err);
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

exports.read = (req, res) => {
  req.project.photo = undefined;
  return res.json(req.project);
};


exports.remove = (req, res) => {
  let project = req.project;
  project.remove((err) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    res.json({

      message: 'Project deleted successfully'
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Image could not be uploaded'
      });
    }

    let project = req.project;
    project = _.extend(project, fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb in size'
        });
      }
      project.photo.data = fs.readFileSync(files.photo.path);
      project.photo.contentType = files.photo.type;
    }

    project.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      res.json(result);
    });
  });
};

/**
 * sell / arrival
 * by sell = /projects?sortBy=sold&order=desc&limit=4
 * by arrival = /projects?sortBy=createdAt&order=desc&limit=4
 * if no params are sent, then all projects are returned
 */

exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : 'asc';
  let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;

  Project.find()
    .select('-photo')  
    .populate('category')
    .sort([
      [sortBy, order]
    ])
    .limit(limit)
    .exec((err, projects) => {
      if (err) {
        return res.status(400).json({
          error: 'Projects not found'
        });
      }
      res.json(projects);
    });
};


/**
 * it will find the projects based on the req project category
 * other projects that has the same category, will be returned
 */

exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Project.find({ _id: { $ne: req.project }, category: req.project.category })
        .limit(limit)
        .populate('category', '_id name')
        .exec((err, projects) => {
            if (err) {
                return res.status(400).json({
                    error: 'Projects not found'
                });
            }
            res.json(projects);
        });
};

exports.listCategories = (req, res) => {
    Project.distinct('category', {}, (err, categories) => {
        if (err) {
            return res.status(400).json({
                error: 'Categories not found'
            });
        }
        res.json(categories);
    });
};



/**
 * list projects by search
 * we will implement project search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the projects to users based on what he wants
 */



exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Project.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Projects not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

exports.photo = (req, res, next) => {
    if (req.project.photo.data) {
        res.set('Content-Type', req.project.photo.contentType);
        return res.send(req.project.photo.data);
    }
    next();
};


exports.listSearch = (req, res) => {
    // create query object to hold search value and category value
    const query = {};
    // assign search value to query.name
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: 'i' };
        // assigne category value to query.category
        if (req.query.category && req.query.category != 'All') {
            query.category = req.query.category;
        }
        // find the project based on query object with 2 properties
        // search and category
        Project.find(query, (err, projects) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(projects);
        }).select('-photo');
    }
};

    exports.decreaseQuantity = (req, res, next) => {
    let bulkOps = req.body.order.projects.map(item => {
        return {
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { quantity: -item.count, sold: +item.count } }
            }
        };
    });

    Project.bulkWrite(bulkOps, {}, (error, projects) => {
        if (error) {
            return res.status(400).json({
                error: 'Could not update project'
            });
        }
        next();
    });
};

