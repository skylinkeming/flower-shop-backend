
const fs = require("fs");



const uploadImageToCloudflare = async (imageFile) => {
    const formData = new FormData();
    // 讀取圖片並轉換成 Buffer
    const blob = new Blob([ imageFile ]);
    formData.append("file", blob, "client_" + imageFile.filename);

    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.CLOUDFLARE_BEARER_TOKEN}`,
            },
            body: formData,
        });
        // Your image has been uploaded
        // Do something with the response, e.g. save image ID in a database
       console.log("====upload result=====")
        console.log(await response.json())

        return response;
    } catch (error) {
        console.error(error)
    }
}

exports.uploadImageToCloudflare = uploadImageToCloudflare;

