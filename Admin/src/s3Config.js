// Storage credentials must never be shipped to the browser. Uploads go through
// Services.uploadFile(), which asks the backend for a short-lived presigned URL.
export const config = {
    bucketName: "clikgett",
    region: "ap-south-1",
};
