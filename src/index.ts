import fs from "fs";
import glob from "glob";
import path from "path";
import program from "commander";
import TurndownService from "turndown";

const turndownService = new TurndownService({ bulletListMarker: "-" });

const noop = () => "";

turndownService.remove("style");

turndownService.remove("title");

turndownService.addRule("replace checkboxes", {
  filter: ["li"],
  replacement: (content: string) =>
    "\n- " + content.replace("☑", "[x] ").replace("☐", "[ ] ")
});

turndownService.addRule("fix title", {
  filter: node =>
    node.nodeName === "DIV" && node.getAttribute("class") === "title",
  replacement: (content: string) => "# " + content
});

turndownService.addRule("remove date", {
  filter: node =>
    node.nodeName === "DIV" && node.getAttribute("class") == "heading",
  replacement: noop
});

turndownService.addRule("remove collaborating data", {
  filter: node =>
    node.nodeName === "DIV" && node.getAttribute("class") == "sharees",
  replacement: noop
});

turndownService.addRule("remove collaborating people", {
  filter: node =>
    node.nodeName === "LI" && node.getAttribute("class") == "sharee",
  replacement: noop
});

TurndownService.prototype.escape = (foo: any) => foo;

program
  .option("-d, --debug", "output extra debugging")
  .option(
    "-p, --path <keep-path>",
    "the folder that contains the html files. Generally something/Takeout/Keep"
  );

program.parse(process.argv);

const allFiles = glob.sync(program.path + "/*.html");

console.info(allFiles.length, " files found in ", program.path);

allFiles.forEach((fileName: string, index: number) => {
  const fromFilePath = path.resolve(fileName);
  const fileContents = fs.readFileSync(fromFilePath, "utf8");
  var stat = fs.statSync(fromFilePath);
  const markdown = turndownService.turndown(fileContents);
  if (program.debug) {
    console.debug("––––––––––––––\n\n\n", markdown);
  }
  const toFilePath = fromFilePath.replace(".html", ".md");
  fs.writeFile(toFilePath, markdown, function(err) {
    if (err) {
      return console.error(err);
    }

    fs.utimesSync(toFilePath, stat.atime, stat.mtime);
    console.info(index, " of ", allFiles.length);
  });
});
