const form = document.getElementById("contactForm");
const list = document.getElementById("contactList");

// API base (same server)
const API_URL = "/contacts";

// Fetch contacts
async function fetchContacts() {
  const res = await fetch(API_URL);
  const contacts = await res.json();
  renderContacts(contacts);
}

function renderContacts(contacts) {
  list.innerHTML = "";
  contacts.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.name} - ${c.email} - ${c.phone}`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteContact(c._id);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Add contact
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const contact = {
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value
  };

  await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact)
  });

  form.reset();
  fetchContacts();
});

// Delete contact
async function deleteContact(id) {
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  fetchContacts();
}

// Load initial contacts
fetchContacts();
