// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $rootScope, $state) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

// UI Router Authentication Check
    $rootScope.$on("$stateChangeStart", function(event, toState, toParams, fromState, fromParams){
          if (toState.data.authenticate && !Parse.User.current()) {
            // User isn’t authenticated
            $state.transitionTo("login");
            event.preventDefault();
          }
    });
})

.config(function($stateProvider, $urlRouterProvider){
    $stateProvider
        .state('root', {
            url: '',
            controller: 'rootCtrl',
            data: {
                authenticate: false
            }
        })
        .state('home', {
            url: '/home',
            templateUrl: 'home.html',
            controller: 'homeCtrl',
            data: {
               authenticate: true
            }
        })
        .state('login', {
            url: '/login',
            templateUrl: 'login.html',
            controller: 'loginCtrl',
            data: {
                authenticate: false
            }
        })
    ;

    // Send to login if the URL was not found
    $urlRouterProvider.otherwise('/login');
})

.controller('rootCtrl', ['$state', function($state) {
    $state.go('home');
}])

.controller('homeCtrl', ['$scope', '$state', function($scope, $state) {
      $scope.logout = function() {
          console.log('Logout');
          Parse.User.logOut();
          $state.go('login');
      };
}])

.controller('loginCtrl', ['$scope', '$state', function($scope, $state) {
    var fbLogged = new Parse.Promise();

    var fbLoginSuccess = function(response) {
        if (!response.authResponse){
            fbLoginError("Cannot find the authResponse");
            return;
        }
        var expDate = new Date(
            new Date().getTime() + response.authResponse.expiresIn * 1000
        ).toISOString();

        var authData = {
            id: String(response.authResponse.userID),
            access_token: response.authResponse.accessToken,
            expiration_date: expDate
        }
        fbLogged.resolve(authData);
        fbLoginSuccess = null;
        console.log(response);
    };

    var fbLoginError = function(error){
        fbLogged.reject(error);
    };

    $scope.login = function() {
        console.log('Login');
        if (!window.cordova) {
            facebookConnectPlugin.browserInit('FACEBOOK_APP_ID');
        }
        facebookConnectPlugin.login(['email'], fbLoginSuccess, fbLoginError);

        fbLogged.then( function(authData) {
            console.log('Promised');
            return Parse.FacebookUtils.logIn(authData);
        })
        .then( function(userObject) {
            var authData = userObject.get('authData');
            facebookConnectPlugin.api('/me', null,
                function(response) {
                    console.log(response);
                    userObject.set('name', response.name);
                    userObject.set('email', response.email);
                    userObject.save();
                },
                function(error) {
                    console.log(error);
                }
            );
            facebookConnectPlugin.api('/me/picture', null,
                function(response) {
                    userObject.set('profilePicture', response.data.url);
                    userObject.save();
                },
                function(error) {
                    console.log(error);
                }
            );
            $state.go('home');
        }, function(error) {
            console.log(error);
        });
    };
}])
