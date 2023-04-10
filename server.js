//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose")
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))
app.set("view engine", "ejs")

app.use(express.static("public"))
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true })
const listSchema = new mongoose.Schema({
  name: String
});

const customListSchema = new mongoose.Schema({
  name: String,
  defItems: [listSchema]
})


const Item = mongoose.model("Item", listSchema);
const customItem = mongoose.model("customItem", customListSchema)

const item1 = new Item({
  name: "Welcome todoList!"
})
const item2 = new Item({
  name: "click + button to add new todoList"
})
const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const defaultItems = [item1, item2, item3]


app.get("/", function (req, res) {

  async function getListNames() {   //callback functions are depricated itseems, so async and await should be used it seems.
    try {
      const ListNames = await Item.find();
      if (ListNames.length === 0) {
        async function insertDefaultItems() {
          try {
            const result = await Item.insertMany(defaultItems);
            console.log("successfully inserted!!")
          } catch (err) {
            console.log(err);
          }
        }
        insertDefaultItems();
        res.redirect("/")
      } else {
        res.render("list", { listTitle: "Today", newItems: ListNames })
      }
    } catch (err) {
      console.log(err);
    }
  }

  getListNames();


});
app.post("/", function (req, res) {
  var item = req.body.newitem
  var listTitle = req.body.button
  const tempItem = new Item({
    name: item
  })
  if (listTitle === "Today") {
    tempItem.save();
    res.redirect("/");
  }
  else {

    async function findOneFunc() {
      try {
        const foundList = await customItem.findOne({ name: listTitle });
        foundList.defItems.push(tempItem);
        foundList.save();
        res.redirect("/" + listTitle);
      } catch (err) {
        console.log(err);
      }
    }
    findOneFunc();
  }
})

app.post("/delete", function (req, res) {

  const idDeleted = req.body.check;
  const listTitle = req.body.listName;

  if (listTitle === "Today") {
    async function deleteItem() {
      try {
        const result = await Item.findByIdAndRemove(idDeleted);
        console.log("deleted successfully!!")
        res.redirect("/")
      } catch (err) {
        console.log(err)
      }
    }
    deleteItem();
  }
  else {
      async function customDelete(){
          try{

            const foundList = await customItem.findOneAndUpdate({name : listTitle}, {$pull : {defItems : {_id : idDeleted}}}); //once give a read for $pull, basically it removes from the array (here it is defItems), where some param equals to provided i/p

              res.redirect("/" + listTitle);

          } catch(err){
              console.log(err);
          }
      }
      customDelete();
  }

})

app.get("/:customItem", function (req, res) {
  const cusItem = req.params.customItem
  async function findCustomItem() {
    try {
      const foundList = await customItem.findOne({ name: cusItem });
      if (!foundList) {
        //creates a new list
        const list = new customItem({
          name: cusItem,
          defItems: defaultItems
        })
        list.save();
        res.redirect("/" + cusItem);
      }
      else {
        res.render("list", { listTitle: cusItem, newItems: foundList.defItems })
      }
    } catch (err) {
      console.log(err);
    }

  }
  findCustomItem();
})


app.get("/about", function (req, res) {
  res.render("about")
})
app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
