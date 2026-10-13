/// <reference types="Cypress" />

describe("/learn behaviour", () => {
  "use strict";

  afterEach(() => {
    cy.visitPage("/logout");
  });

  it("Should redirect if the user has not logged in", () => {
    cy.visitPage("/learn?url=/dashboard");
    cy.url().should("include", "login");
  });

  it("Should redirect a logged user to the allowed learning URL", () => {
    cy.userSignIn();

    cy.request({
      url: "/learn?url=https://evil.example",
      followRedirect: false
    }).then(response => {
      expect(response.status).to.eq(302);
      expect(response.headers.location).to.eq(
        "https://www.khanacademy.org/" +
        "economics-finance-domain/core-finance/" +
        "investment-vehicles-tutorial/ira-401ks/" +
        "v/traditional-iras"
      );
    });
  });
});
