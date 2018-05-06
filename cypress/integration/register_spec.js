const uuidv4 = require('uuid/v4')

describe('End-to-End: The Register Page', function () {
  const existingUser = {}
  before(function () {
    // create existing user
    const randomName = uuidv4()
    existingUser.username = randomName
    existingUser.name = randomName
    existingUser.email = `${randomName}@mail.com`
    existingUser.password = 'fakePassword'
    cy.request('POST', 'http://localhost:4040/api/auth/register', existingUser)
  })
  it('Successfully registers a new user', function () {
    const randomName = uuidv4()
    const newUser = {
      username: randomName,
      name: randomName,
      email: `${randomName}@mail.com`,
      password: 'fakePassword',
      bio: 'My Bio',
    }
    // require hash when visiting directly
    cy.visit('/#/register')
    .then(() => {
      cy.get('input[name=username]').type(newUser.username)
      cy.get('input[name=password]').type(newUser.password)
      cy.get('input[name=name]').type(newUser.name)
      cy.get('#bioInput').type(newUser.bio)
      cy.get('#emailInput').type(newUser.email)
      cy.get('#allowNewsletter').click()
      cy.get('button[name=submit-button]').click()
    })
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/')
    })
    cy.get('a[href="/profile"]').should('contain', 'Profile')
    cy.window().then((win) => {
      expect(win.localStorage).to.have.any.keys('token')
    })
  })
  it('Displays error when registering existing user', function () {
    cy.visit('/#/register')
    .then(() => {
      cy.get('input[name=username]').type(existingUser.username)
      cy.get('input[name=password]').type(existingUser.password)
      cy.get('input[name=name]').type(existingUser.name)
      cy.get('#emailInput').type(existingUser.email)
      cy.get('#allowNewsletter').click()
      cy.get('button[name=submit-button]').click()
    })
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/login')
    })
    cy.get('.toasted.error').should('contain', 'User already exists')
  })
})
