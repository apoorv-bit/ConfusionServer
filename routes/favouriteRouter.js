var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Favourite = require('../models/favourite');
var Dish = require('../models/dishes');
var verify = require('./verify');

var favouriteRouter = express.Router();
favouriteRouter.use(bodyParser.json());

favouriteRouter.route('/')
    .get(function (req, res, next) {
        Favourite.find({'postedBy': req.decoded._doc._id})
            .populate('postedBy')
            .populate('dishes')
            .exec(function (err, favourites) {
                if (err) return err;
                res.json(favourites);
            });
    })

    .post(function (req, res, next) {

        Favourite.find({'postedBy': req.decoded._doc._id})
            .exec(function (err, favourites) {
                if (err) throw err;
                req.body.postedBy = req.decoded._doc._id;

                if (favourites.length) {
                    var favouriteAlreadyExist = false;
                    if (favourites[0].dishes.length) {
                        for (var i = (favourites[0].dishes.length - 1); i >= 0; i--) {
                            favouriteAlreadyExist = favourites[0].dishes[i] == req.body._id;
                            if (favouriteAlreadyExist) break;
                        }
                    }
                    if (!favouriteAlreadyExist) {
                        favourites[0].dishes.push(req.body._id);
                        favourites[0].save(function (err, favourite) {
                            if (err) throw err;
                            console.log('Um somethings up!');
                            res.json(favourite);
                        });
                    } else {
                        console.log('Setup!');
                        res.json(favourites);
                    }

                } else {

                    Favourite.create({postedBy: req.body.postedBy}, function (err, favourite) {
                        if (err) throw err;
                        favourite.dishes.push(req.body._id);
                        favourite.save(function (err, favourite) {
                            if (err) throw err;
                            console.log('Something is up!');
                            res.json(Favourite);
                        });
                    })
                }
            });
    })

    .
    delete(function (req, res, next) {
        Favourite.remove({'postedBy': req.decoded._doc._id}, function (err, resp) {
            if (err) throw err;
            res.json(resp);
        })
    });

favouriteRouter.route('/:dishId')
    .all(verify.verifyOrdinaryUser)
    .delete(function (req, res, next) {

        Favourite.find({'postedBy': req.decoded._doc._id}, function (err, favourites) {
            if (err) return err;
            var favourite = favourites ? favourites[0] : null;

            if (favourite) {
                for (var i = (favourite.dishes.length - 1); i >= 0; i--) {
                    if (favourite.dishes[i] == req.params.dishId) {
                        favourite.dishes.remove(req.params.dishId);
                    }
                }
                favourite.save(function (err, favourite) {
                    if (err) throw err;
                    console.log('Here you go!');
                    res.json(favourite);
                });
            } else {
                console.log('No favourites!');
                res.json(favourite);
            }

        });
    });

module.exports = favouriteRouter;