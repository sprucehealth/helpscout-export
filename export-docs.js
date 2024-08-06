const fs = require("fs");
const HelpScoutDocs = require("helpscout-docs");

const apiKey = process.env.HELPSCOUT_KEY;
const hsdocs = new HelpScoutDocs(apiKey);

hsdocs.collections.getAll(async (err, result) => {
  if (err) {
    console.error(err);
    return;
  }

  const collections = result.collections.items;
  let allArticles = [];

  for (const collection of collections) {
    const articlesResult = await new Promise((resolve, reject) => {
      hsdocs.articles.getAllByCollection(
        { id: collection.id },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
    });

    const articlesDetails = await Promise.all(
      articlesResult.articles.items.map(
        (article) =>
          new Promise((resolve, reject) => {
            hsdocs.articles.get({ id: article.id }, (err, result) => {
              if (err) {
                reject(err);
              } else {
                resolve({
                  title: result.article.name,
                  publicUrl: result.article.publicUrl,
                  content: result.article.text,
                });
              }
            });
          })
      )
    );

    // Ignore the old v3 help center articles
    if (collection.name !== "Browse All Resources") {
      allArticles.push({
        collection: collection.name,
        articles: articlesDetails,
      });
    }
  }

  fs.writeFile(
    "helpscout_docs.json",
    JSON.stringify(allArticles, null, 2),
    (err) => {
      if (err) {
        console.error("Error writing file", err);
      } else {
        console.log("Successfully wrote helpscout docs to file.");
      }
    }
  );
});
