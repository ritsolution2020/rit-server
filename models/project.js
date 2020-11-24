const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            maxlength: 32
        },
        link: {
            type: String,
            required: true,
           
        },
        description: {
            type: String,
            required: true,
            maxlength: 2000
        },
        category: {
            type: ObjectId,
            ref: "Category",
            required: true
        },
     
        photo: {
            data: Buffer,
            contentType: String
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
