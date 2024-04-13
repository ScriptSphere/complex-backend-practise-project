import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/aipError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    // Get user details from the frontend:
    const { fullName, email, username, password } = req.body;

    // Validation - not empty:
    if ([fullName].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    // Check is user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(409, "Username or username already exists");
    }

    // Check for images:
    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage[0].path;

    // Check for avatar:
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // upload them to cloudinary: avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Create user object - create entry in DB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        coverImage: coverImage.url || "",
        password,
        username: username.toLowerCase(),
    });

    // Check for user creation & remove password from password and response token field
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user..."
        );
    }

    // return response
    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "User registered successfully!")
        );
});

export { registerUser };
