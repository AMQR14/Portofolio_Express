const getHero = (req, res) => {
    res.send({ message: 'GET request for hero' });
};

module.exports = {
    getHero
};