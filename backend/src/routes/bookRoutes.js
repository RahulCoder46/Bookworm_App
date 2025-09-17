import express from "express";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";
import Book from "../models/Book.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) =>{
    try {
        const { title, caption, rating, image } = req.body;

        if(!title || !caption || !rating || !image){
            return res.status(400).json({message: "Please provide all fields"});
        }

        //Upload image to cloudinary 
        const uploadResponse = await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;

        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id,
        })

        await newBook.save();

        res.status(201).json(newBook);

    } catch (error) {
        console.log("Error in newBook route", error);
        res.status(500).json({message: "Internal server error"});
    }
});



//pagination => infinite loading
router.get("/", protectRoute, async(req, res) =>{
    //example call from react native frondend
    //const response = await.fetch("https://localhost:3000/api/books?page=1&limit=5");
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 2;
        const skip = (page - 1) * limit;

        const books = await Book.find()
        .sort({ createdAt: -1 }) //get the new books on top 
        .skip(skip)
        .limit(limit)
        .populate("user", "username profileImage");

        const totalBooks = await Book.countDocuments();

        res.send({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });
    } catch (error) {
        console.log("Error in getting all the books route", error);
        res.status(500).json({message: "Internal server error"});
    }
});

router.get("/user", protectRoute, async(req, res) =>{
    try {
        const books = await Book.find({user: req.user._id}).sort({ createdAt: -1 });
        res.json(books);
    } catch (error) {
        console.error("Get user books error:", error.message);
        res.status(500).json({message: "Server Error"});
    }
})

router.delete("/:id", protectRoute, async(req, res) =>{
    try {
        const book = await Book.findById(req.params.id);
        if(!book) return res.status(404).json({message: "Book not found"});

        //check if user is the creator of the book
        if(book.user.toString() !== req.user._id.toString())
            return res.status(401).json({message: "User is not the Owner, Unauthorized user"});

        //https://res/cloudinary.com/delrm4/image/upload/viihi786/PublicId(ufyghgiy7589fhggjfuy87).png

        //delete image from cloudinary as well
        if(book.image && book.image.includes("cloudinary")){
            try {
                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (deleteImageError) {
                console.log("Error in deleting image from cloudinary", deleteImageError);
            }
        }

        //to delete from database
        await book.deleteOne();

        res.json({message: "Book deleted successfully!"});
    } catch (error) {
        
    }
})

export default router;