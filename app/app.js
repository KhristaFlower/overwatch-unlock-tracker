'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
    'ngRoute'
])
.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider.when('/heroes', {
        templateUrl: 'html_partials/view.html',
        controller: ViewController
    });
    $routeProvider.when('/overview', {
        controller: OverviewController,
        template: 'html_partials/overview.html'
    });
    $routeProvider.otherwise({redirectTo: '/heroes'});
}])
.factory('OWStorage', function () {
    var object = {};
    object.storageKey = 'OverwatchData';
    object.storageVersion = 1;
    object.state = null;
    object.getNewStorage = function () {
        // Populate the initial storage data.
        return {
            version: this.storageVersion,
            data: {}
        };
    };
    object.migrateStorage = function () {

    };
    object.persist = function () {
        var storageString = JSON.stringify(this.state);
        localStorage.setItem(this.storageKey, storageString);
    };
    object.restore = function () {

        var rawStorage = localStorage.getItem(this.storageKey);
        var storage = null;

        if (rawStorage === null) {
            storage = this.getNewStorage();
            this.state = storage;

            // Write a copy of the storage now.
            this.persist();
        } else {
            storage = JSON.parse(rawStorage);
        }

        if (storage.version !== this.storageVersion) {
            storage = this.migrateStorage();

            // Update the saved data to the new save version.
            this.state = storage;
            this.persist();
        }

        this.state = storage;

    };
    object.toggle = function (hero, category, item) {
        console.log(hero, category, item);
    };
    object.getState = function () {
        return this.state.data;
    };
    object.setState = function (state) {
        this.state.data = state;
    };
    return object;
})
.controller('HeroSelectController', ['$scope', '$rootScope', 'OWStorage', function ($scope, $rootScope, OWStorage) {

}])
.run(function ($rootScope, OWStorage) {

    OWStorage.restore();

    $rootScope.heroData = heroData;

    $rootScope.saveData = OWStorage.getState();

    $rootScope.selectedHero = 'bastion';

    $rootScope.categories = {
        skins: 'Skins',
        emotes: 'Emotes',
        victory_poses: 'Victory Poses',
        voice_lines: 'Voice Lines',
        sprays: 'Sprays',
        highlight_intros: 'Highlight Intros',
        weapons: 'Weapons'
    };

    $rootScope.selectedCategory = 'skins';

    $rootScope.own = function (hero, category, item) {

        var state = OWStorage.getState();

        if (hero in state && category in state[hero] && item in state[hero][category]) {
            // It could be true or false, just give back the stored value.
            return state[hero][category][item];
        } else {
            // It doesn't exist.
            return false;
        }

    };

    $rootScope.toggle = function (hero, category, item) {

        var state = OWStorage.getState();

        var isSetting = false;

        if (hero in state && category in state[hero] && item in state[hero][category]) {
            // The data exists already, check its value.
            isSetting = !state[hero][category][item];
        } else {
            // It doesn't exist.
            isSetting = true;
        }

        // Create the objects we need to store our information if they don't exist.
        if (!(hero in state)) {
            state[hero] = {};
        }

        if (!(category in state[hero])) {
            state[hero][category] = {};
        }

        // Store the information.
        state[hero][category][item] = isSetting;

        OWStorage.setState(state);
        OWStorage.persist();

    };

    $rootScope.selectHero = function (name) {
        $rootScope.selectedHero = name;
    };

    $rootScope.selectCategory = function (category) {
        $rootScope.selectedCategory = category;
    };

    $rootScope.getNumberOfHeroUnlocks = function(hero) {
        var total = 0;
        for (var category in $rootScope.categories) {
            if (!$rootScope.categories.hasOwnProperty(category)) {
                continue;
            }
            var items = $rootScope.heroData[hero][category];
            total += items.length;
        }
        return total;
    };

    $rootScope.getNumberOfHeroUnlocksOwned = function (hero) {
        var total = 0;
        for (var category in $rootScope.heroData[hero]) {
            if (!$rootScope.heroData[hero].hasOwnProperty(category)) {
                continue;
            }
            var items = $rootScope.heroData[hero][category];
            for (var i in items) {
                if (!items.hasOwnProperty(i)) {
                    continue;
                }
                var item = items[i];
                if ($rootScope.own(hero, category, item.name)) {
                    total += 1;
                }
            }
        }
        return total;
    };

    $rootScope.getNumberOfHeroUnlocksOwnedPercentage = function (hero) {
        var current = $rootScope.getNumberOfHeroUnlocksOwned(hero);
        var total = $rootScope.getNumberOfHeroUnlocks(hero);
        return (current / total) * 100
    };

    $rootScope.getNumberOfHeroUnlocksInCategory = function (hero, category) {
        return $rootScope.heroData[hero][category].length;
    };

    $rootScope.getNumberOfHeroUnlocksInCategoryOwned = function (hero, category) {
        var total = 0;
        for (var i in $rootScope.heroData[hero][category]) {
            if (!$rootScope.heroData[hero][category].hasOwnProperty(i)) {
                continue;
            }
            var item = $rootScope.heroData[hero][category][i];
            if ($rootScope.own(hero, category, item.name)) {
                total += 1;
            }
        }
        return total;
    };

});

function OverviewController($rootScope, $scope, OWStorage) {

}
OverviewController.$inject = ['$rootScope', '$scope', 'OWStorage'];

function ViewController($rootScope, $scope, $routeParams, OWStorage) {

    var heroData = $rootScope.heroData[$routeParams.selectedHero];

}
ViewController.$inject = ['$rootScope', '$scope', '$routeParams', 'OWStorage'];
