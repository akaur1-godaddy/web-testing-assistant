// Example Test File - JavaScript Format
module.exports = [
  {
    name: "Check homepage loads",
    type: "navigation",
    value: "/"
  },
  {
    name: "Verify logo exists",
    type: "assertion",
    selector: "#logo"
  },
  {
    name: "Click navigation link",
    type: "click",
    selector: "nav a:first-child"
  },
  {
    name: "Fill newsletter form",
    type: "input",
    selector: "#newsletter-email",
    value: "test@example.com"
  },
  {
    name: "Submit newsletter",
    type: "click",
    selector: "#newsletter-submit"
  }
];

