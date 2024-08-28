const express = require("express");
const fs = require("fs");
const app = express();
const Firebird = require("node-firebird");
const { tables } = require("./tables.js");

var options = {};
options.host = "0.tcp.ap.ngrok.io";
options.port = 13012;
options.database = "D:/BAMBAR00/ACCURATE_2.GDB";
options.user = "CPS#1";
options.password = "CPS#1";
options.lowercase_keys = false; // set to true to lowercase keys
options.role = null; // default
options.pageSize = 4096;

function writeToFile(filename, data) {
  if (!data || data == "[]") {
    return;
  }

  fs.writeFile(filename, data + "\n", (err) => {
    if (err) {
      console.log("Error writing to file: " + err);
    } else {
      console.log("Data successfully written to " + filename);
    }
  });
}

function getData(tableName, callback) {
  Firebird.attach(options, function (err, db) {
    if (err) {
      console.error("Connection Pool Error:", err);
      return callback(err);
    }

    db.query(`SELECT * FROM ${tableName};`, function (err, result) {
      if (err) {
        console.error(`Error fetching data from table ${tableName}:`, err);
        return callback(err);
      }

      const formattedResult = result.map((item) => {
        for (let key in item) {
          if (Buffer.isBuffer(item[key])) {
            item[key] = item[key].toString("utf8");
          }
        }
        return item;
      });

      writeToFile(`./tables/${tableName}.json`, JSON.stringify(formattedResult));

      db.detach();
      callback(null);
    });
  });
}

function processTables(tables, callback) {
  let index = 0;

  function processNext() {
    if (index < tables.length) {
      getData(tables[index], (err) => {
        if (err) {
          console.error(`Failed to process table: ${tables[index]}`);
          return callback(err);
        }
        index++;
        processNext();
      });
    } else {
      callback(null); // All tables processed
    }
  }

  processNext();
}

processTables(tables, (err) => {
  if (err) {
    console.error("An error occurred during processing:", err);
  } else {
    console.log("All tables processed successfully.");
  }
  
  // Tutup server setelah semua operasi selesai
  console.log("Shutting down the server...");
  process.exit(0);
});

app.listen(3000, () => {
  console.log("app is running at port 3000");
});
