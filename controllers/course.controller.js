
import Course from "../models/course.model.js"
import AppError from "../utils/error.util.js";
import cloudinary from "cloudinary"
import fs from "fs/promises"

const getAllcourse=async function (req,res,next) {
    try{
        const courses=await Course.find({}).select("-lectures");


    res.status(200).json({
        success:true,
        message:"all courses",
        courses
    })
    }
    catch(e){
        next(new AppError(e.message,500));
    }
}

const getLecturesByCourseId=async function (req,res,next) {
    try{
        const {id}=req.params;

        const course= await Course.findById(id);
        if(!course){
            next(new AppError("course not found id",400));
        }
        res.status(200).json({
            success:true,
            message:"course lectures fetched sucessfully",
            lectures:course.lectures
        })
    }catch(e){
        next(new AppError(e.message,500));
    }
}

const createCourse=async function (req,res,next) {
    const{title,description,category,createdBy}=req.body;

    if(!title||!description||!category||!createdBy){
        return next(new AppError("all fields are required",400))
    }

    const course=await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id:"dummy",
            secure_url:"dummy"
        },
    });

    if(!course){
        return next(new AppError("course could not be created,please try again",500))
    }

    if(req.file){
        try{
            const result=await cloudinary.v2.uploader.upload(req.file.path,{
                folder:"lms"
            });
            console.log(JSON.stringify(result))
            if(result){
                course.thumbnail.public_id=result.public_id
                course.thumbnail.secure_url=result.secure_url
            }
    
            fs.rm(`uploads/${req.file.filename}`)    

        }catch(e){
            return next(new AppError(e.message,500))
        }
            }

    await course.save();
    
    res.status(200).json({
        success:true,
        message:"course created successfully",
        course,
    })

}

const updateCourse=async function (req,res,next) {
    try{
        const{id}=req.params;

        const course=await Course.findByIdAndUpdate(
            id,
            {
                $set:req.body//it says that whatever you find in body just override them 
            },
            {
                runValidators:true
            }
        )

        if(!course){
            return next(new AppError("couse with given id does not exist",500))
        }

        res.status(200).json({
            success:true,
            message:"course updated succesfully",
            course
        })

    }catch(e){
        return next(new AppError(e.message,500))
    }
}
const removeCourse=async function (req,res,next) {
    try{
        const{courseId,lectureId}=req.params;
        const course=await Course.findById(courseId)

        if(!course){
            return next(new AppError("course does not exist with this id",400))
        }

        await Course.findByIdAndDelete(lectureId)

        res.status(200).json({
            success:true,
            message:"course deleted succesfully"
        })

    }catch(e){
        return next(new AppError(e.message,500))
    }
}

const addLecturesById = async function (req, res, next) {
    try {
      const { title, description } = req.body;
      const { id } = req.params;
  
      console.log("Request body:", req.body); // Debug: Log body
      console.log("Request file:", req.file); // Debug: Log file
  
      if (!title || !description) {
        return next(new AppError("Title and description are required", 400));
      }
  
      const course = await Course.findById(id);
      if (!course) {
        return next(new AppError("Course does not exist", 404));
      }
  
      const lectureData = {
        title,
        description,
        lecture: {},
      };
  
      if (!req.file) {
        return next(
          new AppError(
            "Video file is required. Ensure the file is a valid video (mp4, mov, avi, mkv, webm) and under 100MB",
            400
          )
        );
      }
  
      try {
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder: "lms",
          resource_type: "video",
        });
  
        if (result) {
          lectureData.lecture.public_id = result.public_id;
          lectureData.lecture.secure_url = result.secure_url;
        }
  
        await fs.rm(`uploads/${req.file.filename}`);
      } catch (e) {
        await fs.rm(`Uploads/${req.file.filename}`).catch(() => {});
        return next(new AppError(`Failed to upload video: ${e.message}`, 500));
      }
  
      course.lectures.push(lectureData);
      course.numbersOfLectures = course.lectures.length;
  
      await course.save();
  
      res.status(200).json({
        success: true,
        message: "Lecture successfully added to the course",
        course,
      });
    } catch (e) {
      if (req.file) {
        await fs.rm(`Uploads/${req.file.filename}`).catch(() => {});
      }
      return next(new AppError(e.message, 500));
    }
  };

  const removeLecture = async function (req, res, next) {
    try {
      const { courseId, lectureId } = req.params;
      const course = await Course.findById(courseId);
  
      if (!course) {
        return next(new AppError("Course does not exist", 404));
      }
  
      const lectureIndex = course.lectures.findIndex(
        (lec) => lec._id.toString() === lectureId
      );
  
      if (lectureIndex === -1) {
        return next(new AppError("Lecture not found", 404));
      }
  
      // Optionally, delete from Cloudinary
      const publicId = course.lectures[lectureIndex].lecture.public_id;
      if (publicId) {
        await cloudinary.v2.uploader.destroy(publicId, { resource_type: "video" });
      }
  
      course.lectures.splice(lectureIndex, 1);
      course.numbersOfLectures = course.lectures.length;
  
      await course.save();
  
      res.status(200).json({
        success: true,
        message: "Lecture deleted successfully",
      });
    } catch (e) {
      return next(new AppError(e.message, 500));
    }
  };
  
  export {
    getAllcourse,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLecturesById,
    removeLecture, // Add the new controller
  };