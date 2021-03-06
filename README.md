# Data Storage Web App Server
##### Simple data storage web app server with API

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

This **_config_** can be changed as whatever you like (setting your own host, port and more), even for the **_prod_** deployment.

### Queries and other models object instantiation from a function-constructor config

It is possible to instantiate queries and other models with the desired **KEYSPACE** name, **HOST** etc. by environment variable or any other variable you like:

```javascript
// DB config (using env var)
const KEYSPACE = process.env.DB_KEYSPACE;
const HOST = process.env.HOST;
const DATACENTER = process.env.DB_DATACENTER;

// DB config (using custom values)
const KEYSPACE = 'data_storage';
const HOST = 'localhost';
const DATACENTER = 'datacenter1';

const QueriesModel = require('../models/dataStorageQueriesModel');
const queries = new QueriesModel(KEYSPACE);

```

You can also check **DBClientModel** and **DBMapperClientModel** constructors. But they have more arguments while instantiating their objects.

Server uses environment variable for the object instantiation by default. However it's up to you on what to choose.


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
      "delete-uploaded-file": "/api/data-storage/delete-uploaded-file/:id",
      "delete-all-uploaded-files": "/api/data-storage/delete-all-uploaded-files",
      "delete-selected-uploaded-files": "/api/data-storage/delete-selected-uploaded-files"
    }
  }
}
```

## How to upload files and process other requests (might be updated)

You can start managing the API by simply using **CURL** command utility (read more about it in this **[article](https://medium.com/@petehouston/upload-files-with-curl-93064dcccc76)**). If you like to test without building the web form UI yet, this is a good start. Here is the small example of **_upload-file_** and other **POST** requests:

```bash
curl -F upload=@/path/to/your/file.extension http://localhost:3000/api/data-storage/upload-file // to upload file
curl -i -X POST http://localhost:3000/api/data-storage/delete-uploaded-file/<object_id> // to delete file - make sure to provide file id (without angle brackets)
curl -i -X POST http://localhost:3000/api/data-storage/delete-all-uploaded-files // to delete completely all files from the data base
curl -i -X POST -H 'Content-Type: application/json' -d '{"new_name": "new_name"}' http://localhost:3000/api/data-storage/rename-uploaded-file/<object_id> // to rename file (object_id should be without angle brackets)
```

### There is request allowing to delete selected files only
For that you need to send the request with **JSON** content type with an array consisting ids:

```bash
curl -i -X POST -H 'Content-Type: application/json' -d '{"ids": ["<obj_id_here>","<obj_id_here>"]}' http://localhost:3000/api/data-storage/delete-selected-uploaded-files

```

### Little bit about GET requests...
**GET** requests instead can of course be processed via browser. For example to download file, you first need to go to the **_meta-data-content_** page to identify **_object_id_** of the file you prefer to delete. Once you have it, the request will look like this:

```
http://localhost:3000/api/data-storage/download_file/<object_id> // without angle brackets
```

On other hand, you can build your own web form and connect it with the API to process things.

## How to upload files with actual web form (might be updated)

To upload files using a web form - make sure to specify **_enctype_** and include **_name_** attribute into the **_input_** tag. **Note! For now POST API requests support _multipart/form-data_ form's body requests encoding only!**

```html
<form method="POST" action="http://localhost:3000/api/data-storage/upload-file" enctype="multipart/form-data">
  <input type="file" name="upload">
  <button type="submit">Submit</button>
</form>
```

###### Seems all, you should be all set!

## What's next?
I might implement API requests that support **_application/x-www-form-urlencoded_** form's body requests encoding and ~~**progress bar upload file interaction**~~ - looks like no need to implement that, as it is possible to do on the Front-End side while sending the request to the server. Finally - maybe going to review the **_buffer encoding_** on uploading/downloading files and **_CORS_** policies.
