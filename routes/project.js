const express = require("express");
const router = express.Router();

const {
    create,
    projectById,
    read,
    remove,
    update,
    list,
    listRelated,
    listCategories,
    listBySearch,
    photo,
    listSearch
} = require("../controllers/project");
const {
    requireSignin,
    isAuth,
    isAdmin
} = require("../controllers/auth");
const {
    userById
} = require("../controllers/user");

router.get("/project/:projectId", read);
router.post("/project/create/:userId", requireSignin, isAuth, isAdmin, create);
router.delete(
    "/project/:projectId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    remove
);
router.put(
    "/project/:projectId/:userId",
    requireSignin,
    isAuth,
    isAdmin,
    update
);

router.get("/projects", list);
router.get("/projects/search", listSearch);
router.get("/projects/related/:projectId", listRelated);
router.get("/projects/categories", listCategories);
router.post("/projects/by/search", listBySearch);
router.get("/project/photo/:projectId", photo);

router.param("userId", userById);
router.param("projectId", projectById);

module.exports = router;