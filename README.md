[![Build Status](https://travis-ci.org/ottopecz/mainliner.svg?branch=master)](https://travis-ci.org/ottopecz/mainliner)

# mainliner

Inversion of control container and dependency injector for node6.

The inspiration is the excellent [intravenous](github.com/RoyJacobs/intravenous) which seems to be abandoned. All the interfaces of [intravenous](github.com/RoyJacobs/intravenous) reimplemented from scratch in node6. With some exceptions...

Differences between **mainliner** and intravenous

1. **mainliner** supports native classes. Yay!!!
2. You cannot dispose anything with **mainliner**(yet). Boo!!! Hence there are no sub-containers.

**mainliner** can deal with 3 kinds of things

1. **class** - It will be instantiated and the instance will be injected
2. **function** - It will be executed and whatever it returns will be injected
3. **passthrough** - Anything which is not a class or a function will be injected as it is

##Getting started
First install it: `npm install mainliner`
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class DoesSomeThingForMe {}
function returnsThingForMe() {return "aThing";}
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(doesSomethingForMe, returnedThing, gd) {
    assert.ok(doesSomethingForMe instanceof DoesSomeThingForMe);
    assert.equal(returnedThing, "aThing");
    assert.equal(gd, globalData);
  }
}

// Declare dependencies
MyClass.$inject = ["doesSomethingForMe", "returnedThing", "gd"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("doesSomethingForMe", DoesSomeThingForMe);
container.register("returnedThing", returnsThingForMe);
container.register("gd", globalData);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

##Advanced usage
####Pass an extra parameter
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(gd, extraParam) {
    assert.equal(gd, globalData);
    assert.equal(extraParam, "extraParam");
  }
}

// Declare dependencies
MyClass.$inject = ["gd"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("gd", globalData);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing", "extraParam");

assert.ok(myThing instanceof MyClass);
```
####Creating instances runtime
You can factorize a class - Only a class - by appending suffix "Factory" to it's registered name. If you do so the injector will inject an object which has a get method which will instantiate the class for you anytime you want
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class DoesSomethingThingForMe {
  constructor(param) {
    assert.equal(param, "factoryParam");
  }
}

// My class
class MyClass {
  constructor(doesSomethingForMeFactory) {
    const instance = doesSomethingForMeFactory.get("factoryParam");
    assert.ok(instance instanceof DoesSomethingThingForMe);
  }
}

// Declare dependencies
MyClass.$inject = ["doesSomethingForMeFactory"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("doesSomethingForMe", DoesSomethingThingForMe);
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

####Optional dependency
You can declare something as optional if you add the "?" suffix to it's name
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
const globalData = {"foo": "bar"};

// My class
class MyClass {
  constructor(gd) {
    assert.equal(gd, null);
  }
}

// Declare dependencies
MyClass.$inject = ["gd?"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
// global data is not registered but optional
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof MyClass);
```

##Life cycles
You can define the life cycle of an instance (so it works only for classes). There are three life cycles.

1. **perRequest** - The default life cycle of an instance. If you don't specify anything upon registration your instance will be a "perRequest" one. A request means one execution of the "get" method of the container. If the same class is accessed more times upon a request the instance will be created just once. So the same instance will injected multiple times.
2. **singleton** - The instance will be created only once no matter how many requests you make.
3. **unique** - The instance will be created every single time the class is accessed. No matter how many requests you make

####perRequest
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class OnePerRequest {}

class Class2 {
  constructor(onePerRequest) {
    assert.ok(onePerRequest instanceof OnePerRequest);
    this.refToOnePerRequest = onePerRequest
  }
}

// Declare dependencies
Class2.$inject = ["onePerRequest"];

// My class
class Class1 {
  constructor(dependency1, onePerRequest) {
    assert.ok(onePerRequest instanceof OnePerRequest);
    dependency1.refToOnePerRequest.extraProp = "extraPop"; // Adding property to reference to the previous injection
    assert.equal(onePerRequest.extraProp, "extraPop"); // If the same instance the extra property must be there
  }
}

// Declare dependencies
Class1.$inject = ["dependency1", "onePerRequest"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("onePerRequest", OnePerRequest, "perRequest");
container.register("dependency1", Class2);
container.register("myThing", Class1);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof Class1);
```

####singleton
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class Singleton {}

// My class
class MyClass {
  constructor(single) {
    assert.ok(single instanceof Singleton);
    this.single = single;
  }
}

// Declare dependencies
MyClass.$inject = ["single"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("single", Singleton, "singleton");
container.register("myThing", MyClass);

// Get your thing out of the container
const myThing1 = container.get("myThing");
const myThing2 = container.get("myThing");

assert.ok(myThing1 instanceof MyClass);
assert.ok(myThing2 instanceof MyClass);
myThing1.single.extraProp = "extraProp";
assert.equal(myThing2.single.extraProp, "extraProp"); // The extra property shows up hence it's a singleton
```

####unique
```javascript
const assert = require("assert");
const mainliner = require("mainliner");

// Dependencies
class Unique {}

class Class2 {
  constructor(unique) {
    assert.ok(unique instanceof Unique);
    this.refToUnique = unique
  }
}

// Declare dependencies
Class2.$inject = ["unique"];

// My class
class Class1 {
  constructor(dependency1, unique) {
    assert.ok(unique instanceof Unique);
    dependency1.refToUnique.extraProp = "extraPop"; // Adding property to reference to the previous injection
    assert.ifError(unique.extraProp); // If this a unique the extra property should not be there
  }
}

// Declare dependencies
Class1.$inject = ["dependency1", "unique"];

// Create ioc container
const container = mainliner.create();

// Register everything you need
container.register("unique", Unique, "unique");
container.register("dependency1", Class2);
container.register("myThing", Class1);

// Get your thing out of the container
const myThing = container.get("myThing");

assert.ok(myThing instanceof Class1);
```

##Links
Roy Jacobs' [intravenous](https://github.com/RoyJacobs/intravenous) and Mark Seeman's [blog](http://blog.ploeh.dk/)