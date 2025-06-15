import '@testing-library/cypress/add-commands';

// Cypress commands for handling authentication
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Command to upload a template file
Cypress.Commands.add('uploadTemplate', (filePath: string, templateName: string) => {
  cy.visit('/templates');
  cy.contains('button', 'Upload New Template').click();
  cy.get('input[type="file"]').selectFile(filePath, { force: true });
  cy.get('input#template-name').type(templateName);
  cy.contains('button', 'Upload').click();
});

// Command to generate a document
Cypress.Commands.add(
  'generateDocument',
  (templateName: string, documentName: string, fields: Record<string, string>) => {
    cy.visit('/templates');
    cy.contains(templateName).parent().contains('Generate').click();
    cy.get('input#pdfName').type(documentName);

    // Fill in all fields
    Object.entries(fields).forEach(([placeholder, value]) => {
      cy.get(`input[placeholder*="${placeholder}"]`).type(value);
    });
  }
);

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      uploadTemplate(filePath: string, templateName: string): Chainable<void>;
      generateDocument(
        templateName: string,
        documentName: string,
        fields: Record<string, string>
      ): Chainable<void>;
    }
  }
}
