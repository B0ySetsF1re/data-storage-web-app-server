# Data Storage Web App Server
##### A simple data storage web app server with API

## NPM and Cassandra install/config

Before cloning the repository, please make sure you have Node.js, NPM and Cassandra database installed! Here are some snippets:

* Check out this **[link](https://nodejs.org/en/)** to install **Node.js** and **NPM**.
* To install **Cassandra**, check out its **[official documentation](https://cassandra.apache.org/doc/latest/)**. I would also advise to check the following links: **[download cassandra](https://cassandra.apache.org/download/)**, **[Node.js Driver Docs](https://docs.datastax.com/en/developer/nodejs-driver/4.6/getting-started/)**, **[Installing and configuring Cassandra on Linux](https://docs.nomagic.com/display/TWCloud190/Installing+and+configuring+Cassandra+on+Linux)**.

## Cloning the repository

Make sure you have the git utility installed on your computer. Check out **[this](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)** article on how to set it up.

Here are the steps on how to clone and configure the repository:

* Cloning repository:

  ```bash
  git clone https://github.com/B0ySetsF1re/data-storage-web-app-server.git
  ```
* Then in the terminal navigate to the project's folder using **cd** command to install dependencies etc.

* Installing dependencies

  ```bash
  npm install
  ```
* Running the web app

  ```bash
  node app.js
  ```
You can also use **[nodemon](https://www.npmjs.com/package/nodemon)** package, so that you wouldn't need to manually restart the server each time you apply some changes.

* If you would like to install additional package/dependency for the app, you can do it as following:

  ```bash
  npm install <package_name> --save
  ```

## Setting up host and keyspace name environment variables
After cloning the repository, **you need to configure the environment variables for a keyspace name, host etc. Otherwise the server won't even run**. First of all create ```.env``` file in the root of the web app directory. Here is basic example of the variables configured for the _development_ web app deployment:

```
HOST=localhost
PORT=3000

DB_KEYSPACE=data_storage
DB_DATACENTER=datacenter1

```

This _config_ can be changed as whatever you like (setting your own host, port and more), even for the _prod_ deployment.

## API requests list (might be updated)

```json
{
  "APIs": {
    "GET": {
      "APIs-list": "/api/data-storage",
      "meta-data-content": "/api/data-storage/meta-data-content",
      "files-stats": "/api/data-storage/files-stats",
      "download-file": "/api/data-storage/download-file/:id"
    },
    "POST": {
      "upload-file": "/api/data-storage/upload-file",
      "rename-uploaded-file": "/api/data-storage/rename-uploaded-file/:id",
      "delete-uploaded-file": "/api/data-storage/delete-uploaded-file/:id"
    }
  }
}
```

## How to upload files and process other requests (might be updated)

You can start managing the API by simply using **CURL** command utility (read more about it in this **[article](https://medium.com/@petehouston/upload-files-with-curl-93064dcccc76)**). If you like to test without building the web form UI yet, this is a good start. Here is the small example of _upload-file_ request:

```bash
curl -F upload=@/path/to/your/file.extention http://localhost:3000/api/data-storage/upload-file
```

On other hand, you can build your own web form and connect it with the API to process things.

Seems all, you should be all set. The documentation however more likely will be updated...
