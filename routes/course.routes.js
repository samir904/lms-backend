import { Router } from "express";
import {
  addLecturesById,
  createCourse,
  getAllcourse,
  getLecturesByCourseId,
  removeCourse,
  removeLecture,
  updateCourse,
} from "../controllers/course.controller.js";
import {
  authorizedRoles,
  authorizedSubscriber,
  isLoggedIn,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllcourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("thumbnail"),
    createCourse
  )
  .delete(isLoggedIn, authorizedRoles("ADMIN"), removeCourse);

router
  .route("/:id")
  .get(isLoggedIn,authorizedSubscriber, getLecturesByCourseId)
  .put(isLoggedIn, authorizedRoles("ADMIN"), updateCourse)
  .post(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    upload.single("lecture"),
    addLecturesById
  );
  router.route("/:courseId/lectures/:lectureId").delete(
    isLoggedIn,
    authorizedRoles("ADMIN"),
    removeLecture
  );

export default router;