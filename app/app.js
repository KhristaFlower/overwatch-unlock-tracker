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
    object.storageVersion = 2;
    object.state = null;
    object.getNewStorage = function () {
        // Populate the initial storage data.
        return {
            version: this.storageVersion,
            data: {}
        };
    };
    object.migrateStorage = function () {

        if (this.state.version > this.storageVersion) {
            console.log('saveVersionNewerThanStorageVersion');
        } else if (this.state.version < this.storageVersion) {
            console.log('migratingVersion');
            this.doMigration();
        } else {
            console.log('migrationNotRequired');
        }


    };
    object.doMigration = function () {

        if (this.state.version == 1) {
            this.migrateSimpleRename('genji', 'voice_lines', 'Teah!', 'Yeah!');
            this.migrateSimpleRename('zarya', 'skins', 'Sawn', 'Dawn');
            this.state.version += 1;
        }

        this.persist();

    };
    object.migrateSimpleRename = function (hero, category, oldName, newName) {

        // If the user never used this field then we don't need to do anything.
        if (this.isSet(hero, category, oldName)) {

            // We only need to create the entry in the new save format if they have it enabled now.
            if (this.own(hero, category, oldName)) {

                // Since the new value doesn't exist, toggling will create it.
                this.toggle(hero, category, newName);
            }

            // Remove the old data, it is no longer needed in the save data.
            this.remove(hero, category, oldName);
        }

    };
    object.persist = function () {

        var debugPersisting = false;

        if (debugPersisting) {
            console.log('DEBUG PERSISTING', this.state);
        } else {
            var storageString = JSON.stringify(this.state);
            localStorage.setItem(this.storageKey, storageString);
        }
    };
    object.restore = function () {

        var rawStorage = localStorage.getItem(this.storageKey);

        if (rawStorage === null) {
            this.state = this.getNewStorage();

            // Write a copy of the storage now.
            this.persist();
        } else {
            this.state = JSON.parse(rawStorage);
        }

        if (this.state.version !== this.storageVersion) {
            this.migrateStorage();

            // Update the saved data to the new save version.
            this.persist();
        }

    };
    object.getState = function () {
        return this.state.data;
    };
    object.setState = function (state) {
        this.state.data = state;
    };

    // Storage management
    object.isSet = function (hero, category, item) {

        var state = this.getState();

        return !!(hero in state && category in state[hero] && item in state[hero][category]);

    };
    object.remove = function (hero, category, item) {

        // Check that the data we wish to remove actually exists.
        if (!this.isSet(hero, category, item)) {
            return;
        }

        // Remove the item.
        delete this.state.data[hero][category][item];

        // Remove any empty objects on the way up the chain.
        if (Object.keys(this.state.data[hero][category]).length == 0) {
            delete this.state.data[hero][category];

            if (Object.keys(this.state.data[hero]).length == 0) {
                delete this.state.data[hero];
            }
        }
    };
    object.own = function (hero, category, item) {

        var state = this.getState();

        if (hero in state && category in state[hero] && item in state[hero][category]) {
            // It could be true or false, just give back the stored value.
            return state[hero][category][item];
        } else {
            // It doesn't exist.
            return false;
        }

    };
    object.toggle = function (hero, category, item) {

        var state = this.getState();
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

        this.setState(state);
        this.persist();

    };

    return object;
})
.controller('HeroSelectController', ['$scope', '$rootScope', 'OWStorage', function ($scope, $rootScope, OWStorage) {

}])
.run(function ($rootScope, OWStorage) {

    OWStorage.restore();
    console.log('restorationComplete');

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
        return OWStorage.own(hero, category, item);
    };

    $rootScope.toggle = function (hero, category, item) {
        OWStorage.toggle(hero, category, item);
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
