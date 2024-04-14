//const e = require("express");

//const { application } = require("express");

const getCrafts = async () => {
  try {
    return (await fetch("api/crafts/")).json();
  } catch (error) {
    console.log(error);
  }
};

const showCrafts = async () => {
  const crafts = await getCrafts();
  const craftList = document.getElementById("craft-list");
  craftList.innerHTML = "";

  const numCrafts = crafts.length;
  const numColumns = 4;
  let numPerColumn;
  if (numCrafts % numColumns != 0) {
    numPerColumn = Math.ceil(numCrafts / numColumns);
  } else {
    numPerColumn = Math.ceil(numCrafts / numColumns);
  }
  console.log(numCrafts % numColumns);
  console.log(numPerColumn);

  for (let i = 0; i < numColumns; i++) {
    const craftImagesContainer = document.createElement("div");
    craftImagesContainer.classList.add("columns");

    for (
      let j = i * numPerColumn;
      j < Math.min((i + 1) * numPerColumn, numCrafts);
      j++
    ) {
      const craft = crafts[j]; // Get the craft for this iteration
      console.log("CRAFT: " + craft);
      const imgSect = document.createElement("section");
      imgSect.classList.add("craft");
      imgSect.classList.add("column");
      craftImagesContainer.append(imgSect);

      // Making the whole section clickable
      const a = document.createElement("a");
      a.href = "#";
      imgSect.append(a);

      const img = document.createElement("img");
      img.classList.add("columns-image");
      img.src = "images/" + craft.img;
      console.log("IMAGE FILE:   " + craft.img);
      img.style.width = "90%";
      img.style.height = "auto";
      a.append(img);

      a.onclick = (e) => {
        e.preventDefault();
        displayDetails(craft);
      };
    }

    craftList.append(craftImagesContainer);
  }
};

const displayDetails = (craft) => {
  openDialog("craft-details");

  const craftDetails = document.getElementById("craft-details");
  craftDetails.innerHTML = "";

  const image = document.createElement("img");
  console.log("DETAILS:  " + craft.img);
  image.src = "images/" + craft.img;
  image.style.maxWidth = "50%";
  image.style.height = "auto";
  craftDetails.append(image);

  const h3 = document.createElement("h3");
  h3.innerHTML = craft.name;
  craftDetails.append(h3);

  const dLink = document.createElement("a");
  dLink.innerHTML = "&#10008;";
  dLink.style.fontSize = "30px";
  craftDetails.append(dLink);
  dLink.id = "delete-link";

  const eLink = document.createElement("a");
  eLink.innerHTML = "&#9998;";
  eLink.style.fontSize = "30px";
  craftDetails.append(eLink);
  eLink.id = "edit-link";

  const p = document.createElement("p");
  p.innerHTML = craft.description;
  craftDetails.append(p);

  const ul = document.createElement("ul");
  craftDetails.append(ul);

  craft.supplies.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = item;
    ul.append(li);
  });

  eLink.onclick = showCraftForm;
  dLink.onclick = deleteCraft.bind(this, craft);

  populateEditForm(craft);
};

const populateEditForm = (craft) => {
  const form = document.getElementById("craft-form");
  form._id.value = craft._id;
  form.name.value = craft.name;
  form.description.value = craft.description;

  const imgPreview = document.getElementById("img-prev");
  document.getElementById("img-prev").src = "images/" + craft.img;
  console.log("CRAFT IMAGE: " + craft.img);
  imgPreview.style.display = "block";

  populateSupplies(craft.supplies);
};

const populateSupplies = (supplies) => {
  const section = document.getElementById("supply-boxes");
  supplies.forEach((supply) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = supply;
    section.append(input);
  });
};

const validateCraft = (formData) => {
  const name = formData.get("name");
  const description = formData.get("description");
  const image = formData.get("img"); // Assuming 'img' is the name of the image field

  if (!name || name.length < 3) {
    resetForm();
    document.getElementById("dialog").style.display = "none";
    showCrafts();
    return "Name must be at least 3 characters long.";
  }
  if (!description || description.length < 3) {
    resetForm();
    document.getElementById("dialog").style.display = "none";
    showCrafts();
    return "Description must be at least 3 characters long.";
  }
  if (!image && image != null) {
    return "An image must be selected.";
  }
  return null; // Return null if validation passes
};

const addEditCraft = async (e) => {
  e.preventDefault();
  const form = document.getElementById("craft-form");
  const formData = new FormData(form);
  formData.append("supplies", getSupplies());

  const validationError = validateCraft(formData);

  if (validationError) {
    alert(validationError);
    return;
  }

  let response;

  if (form._id.value.trim() == "") {
    response = await fetch("/api/crafts", {
      method: "POST",
      body: formData,
    });

    if (response.status === 400) {
      alert(
        "Your addition was not added to the main page because it did not meet: \n1. the NAME or DESCRIPTION minimum character requirement of 3\n 2. An image was not input"
      );
    }
  } else {
    response = await fetch("/api/crafts/" + form._id.value, {
      method: "PUT",
      body: formData,
    });
  }

  if (response.status != 200) {
    console.log("Add/Edit did not go through to server");
    return;
  }

  await response.json();

  // Reset form and display crafts only after the request is completed
  resetForm();
  document.getElementById("dialog").style.display = "none";
  showCrafts();
};

const getSupplies = () => {
  const inputs = document.querySelectorAll("#supply-boxes input");
  let supplies = [];

  inputs.forEach((input) => {
    supplies.push(input.value);
  });

  return supplies;
};

const resetForm = () => {
  const form = document.getElementById("craft-form");
  form.reset();
  form._id.value = "";
  document.getElementById("supply-boxes").innerHTML = "";
  document.getElementById("img-prev").src = "";
};

const showCraftForm = (e) => {
  openDialog("craft-form");
  console.log(e.target);
  if (e.target.getAttribute("id") != "edit-link") {
    resetForm();
  }
};

const deleteCraft = async (craft) => {
  const confirmDelete = confirm("Are you sure you want to delete this craft?");

  if (!confirmDelete) {
    return;
  }

  let response = await fetch(`api/crafts/${craft._id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  if (response.status != 200) {
    console.log("DELETE not completed");
    return;
  }

  let result = await response.json();
  resetForm();
  showCrafts();
  document.getElementById("dialog").style.display = "none";
};

const addSupply = (e) => {
  e.preventDefault();
  const section = document.getElementById("supply-boxes");
  const input = document.createElement("input");
  input.type = "text";
  section.append(input);
};

const openDialog = (id) => {
  document.getElementById("dialog").style.display = "block";
  document.querySelectorAll("#dialog-details > *").forEach((item) => {
    item.classList.add("hidden");
  });
  console.log(document.getElementById(id));
  document.getElementById(id).classList.remove("hidden");
};

showCrafts();
document.getElementById("craft-form").onsubmit = addEditCraft;
document.getElementById("add-link").onclick = showCraftForm;
document.getElementById("add-supplies").onclick = addSupply;
document.getElementById("cancel").onclick = resetForm;

document.getElementById("img").onchange = (e) => {
  if (!e.target.files.length) {
    document.getElementById("img-prev").src = "";
    return;
  }
  document.getElementById("img-prev").src = URL.createObjectURL(
    e.target.files.item(0)
  );
};
