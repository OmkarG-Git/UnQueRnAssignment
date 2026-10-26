const server = require("./app");

const PORT = 5000;


server.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
})