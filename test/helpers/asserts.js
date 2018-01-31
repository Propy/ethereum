

module.exports = assert => ({
    equal: (actual, expected) => {
        assert.equal(actual.valueOf(), expected.valueOf());
    },
    isTrue: assert.isTrue,
    isFalse: assert.isFalse,
    throws: promise => {
        return promise.then(
            assert.fail,
            (error) => {
                console.error(error.message)
                assert.isTrue(error.message.includes("assert"));
                return true;
            }
        );
    },
    reverts: promise => {
        return promise.then(
            assert.fail,
            (error) => {
                console.error(error.message)
                assert.isTrue(error.message.includes("revert"));
                return true;
            }
        );
    },
    error: async (call, args) => {
        let success = false;
        try {
            await call(...args);
            success = true;
        } catch (e) {}
        assert.equal(success, false);
    },

    compareBigNumberLists: (result, expected) => {
        //console.log(result, expected);
        for (let i in result) {
            assert.equal(result[i].toString(), expected[i].toString());
        }
    },
});
