"use strict";
const DocumentRegistry = artifacts.require("DocumentRegistry");
const DocumentRegistrar = artifacts.require("DocumentRegistrar");
const BaseDocument = artifacts.require("BaseDocument");

const DOCUMENT_HASH = web3.sha3("This is a some document!");
const DOCUMENT_HASH2 = web3.sha3("This is a some another document!");
const TAG1 = "tag1";
const TAG2 = "tag2";
const FAKE_TAG = "fake";

contract("DocumentRegistry (BaseDocument)", (accounts) => {

    let registryInstanse;
    let document1;
    let document2;

    before('setup', async () => {
        await DocumentRegistry.deployed().then(instance => registryInstanse = instance);
        await BaseDocument.new(DOCUMENT_HASH).then(instance => document1 = instance);
        await BaseDocument.new(DOCUMENT_HASH2).then(instance => document2 = instance);
    });

    it('should add tags into documents', async () => {
        await document1.addTag(TAG1)
            .then(() => document1.tags(0))
            .then(tag => assert.equal(tag, TAG1, "Tag is not correct"));
        await document2.addTag(TAG1)
            .then(() => document2.tags(0))
            .then(tag => assert.equal(tag, TAG1, "Tag is not correct"))
            .then(() => document2.addTag(TAG2))
            .then(() => document2.tags(1))
            .then(tag => assert.equal(tag, TAG2, "Tag is not correct"));
    });

    it('should set documents finalized', async () => {
        await document1.setFinalized()
            .then(() => document1.finalized())
            .then(finalized => assert.isTrue(finalized, "Document is not finalized"));
        await document2.setFinalized()
            .then(() => document2.finalized())
            .then(finalized => assert.isTrue(finalized, "Document is not finalized"));
    });

    it('should register documents', async () => {
        await registryInstanse.register(document1.address)
            .then(() => registryInstanse.exists(DOCUMENT_HASH))
            .then(exists => assert.isTrue(exists, "Document isn't saved"));
        await registryInstanse.register(document2.address)
            .then(() => registryInstanse.exists(DOCUMENT_HASH2))
            .then(exists => assert.isTrue(exists, "Document isn't saved"));
    });

    it('should find document by hash', async () => {
        await registryInstanse.getDocument(DOCUMENT_HASH)
            .then(document => assert.equal(document, document1.address));
        await registryInstanse.getDocument(DOCUMENT_HASH2)
            .then(document => assert.equal(document, document2.address));
    });

    it('should find document by tag 1', async () => {
        await registryInstanse.getDocumentsByTag(TAG1)
            .then(documents => {
                assert.include(documents, document1.address);
                assert.include(documents, document2.address);
            });
    });

    it('should find document by tag 2', async () => {
        await registryInstanse.getDocumentsByTag(TAG2)
            .then(documents => {
                assert.notInclude(documents, document1.address);
                assert.include(documents, document2.address);
            });
    });

});
