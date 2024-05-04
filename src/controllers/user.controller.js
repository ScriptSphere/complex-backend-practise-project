import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/aipError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (id) => {
    try {
        const user = await User.findOne({ _id: id });
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (e) {
        console.log(e);
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access tokens"
        );
    }
};

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
    const coverImageLocalPath = req.files?.coverImage?.[0].path;
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
        coverImage: coverImage?.url || "",
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

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "Username or email and password is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid user credentials...");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                },
                "User logged in successfully!"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        { _id: req.user._id },
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json();
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request...");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(400, "Invalid refresh token");
        }

        if (user.refreshToken !== incomingRefreshToken) {
            throw new ApiError(400, "Refresh token is expired or used");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshTokens(user._id);
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken)
            .cookie("refreshToken", refreshToken)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully!"
                )
            );
    } catch (error) {
        throw new ApiError(500, error.message || "Invalid refresh token");
    }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
