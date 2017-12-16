module.exports = assert => ({
    equal: (actual, expected) => {
        assert.equal(actual.valueOf(), expected.valueOf());
    },
    isTrue: assert.isTrue,
    isFalse: assert.isFalse,
    throws: promise => {
        console.log(promise)
        return promise.then(assert.fail, () => true);
    },
    error: async (call, args) => {
        let success = false;
        try {
            await call(...args);
            success = true;
        } catch (e) {}
        assert.equal(success, false);
    },
});
