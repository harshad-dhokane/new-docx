/// <reference types="cypress" />

describe('Template Generation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('test@example.com', 'password123');
  });

  it('should successfully upload a template', () => {
    cy.uploadTemplate('cypress/fixtures/test-template.docx', 'Test Template');
    cy.contains('Template uploaded successfully').should('be.visible');
    cy.contains('Test Template').should('be.visible');
  });

  it('should generate a document with filled fields', () => {
    // First ensure we have a template
    cy.visit('/templates');
    cy.contains('Test Template').should('be.visible');

    // Generate a document
    cy.generateDocument('Test Template', 'Generated Doc 1', {
      name: 'John Doe',
      date: '2024-03-20',
      company: 'Test Corp',
      address: '123 Test St',
    });

    // Check if document name is set
    cy.get('input#pdfName').should('have.value', 'Generated Doc 1');

    // Verify all fields are filled
    cy.get('input[placeholder*="name"]').should('have.value', 'John Doe');
    cy.get('input[placeholder*="date"]').should('have.value', '2024-03-20');
    cy.get('input[placeholder*="company"]').should('have.value', 'Test Corp');
    cy.get('input[placeholder*="address"]').should('have.value', '123 Test St');

    // Generate document
    cy.contains('button', 'Generate DOCX').click();
    cy.contains('Downloaded!').should('be.visible');
  });

  it('should show validation message when required fields are empty', () => {
    cy.visit('/templates');
    cy.contains('Test Template').parent().contains('Generate').click();

    // Try to generate without filling fields
    cy.contains('button', 'Generate DOCX').should('be.disabled');
    cy.contains('Please fill in at least one field').should('be.visible');
  });
});
