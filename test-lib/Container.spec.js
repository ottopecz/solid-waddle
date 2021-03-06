const Composer = require("talentcomposer");
const {expect} = require("@hapi/code");
const Lab = require("@hapi/lab");
const lifeCycles = require("../lib/lifeCycles");
const modifiers = require("../lib/modifiers");
const Graph = require("../lib/Graph");
const Container = require("../lib/Container");

const {describe, it} = exports.lab = Lab.script();

describe("The \"container\" instance", () => {

  describe("when it gets created", () => {

    const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

    it("should be an instance of the Container class", () => {

      expect(container).to.be.an.instanceOf(Container);
    });
  });
});

describe("The \"register\" method of the container instance", () => {

  describe("when it's executed", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should register a new vertex", () => {

      class Foo {
        static get $inject() {
          return ["bar"];
        }
      }

      container.register("foo", Foo);

      expect(vertexes.has("foo")).to.be.true();
    });
  });

  describe("when it's executed but the \"inject\" definition is not an array", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should throw an error", () => {

      class Foo {
        static get $inject() {
          return {"foo": "foo"};
        }
      }

      expect(() => container.register("foo", Foo))
        .to.throw(Error, "The \"$inject\" list should be an array of strings");
    });
  });

  describe("when it's executed but the \"inject\" definition is not an array of strings", () => {

    const vertexes = new Map();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes), modifiers);

    it("should throw an error", () => {

      class Bar {
        static get $inject() {
          return [{"bar": "bar"}];
        }
      }

      expect(() => container.register("bar", Bar))
        .to.throw(Error, "The \"$inject\" list should be an array of strings");
    });
  });

  describe("when it's executed but the \"inject\"is not defined", () => {

    const vertexes = new Map();
    const edges = new Set();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes, edges), modifiers);

    it("should not register any the new edges", () => {

      class Foo {}

      container.register("foo", Foo);

      expect(edges).to.equal(new Set());
    });
  });

  describe("when it's executed and the \"inject\" definition is an array of strings", () => {

    const vertexes = new Map();
    const edges = new Set();
    const container = new Container(new Graph(lifeCycles, modifiers, vertexes, edges), modifiers);

    it("should register the new edges", () => {

      class Foo {
        static get $inject() {
          return ["bar", "rab"];
        }
      }

      container.register("foo", Foo);

      expect(edges).to.equal(new Set([["foo", "bar"], ["foo", "rab"]]));
    });
  });
});

describe("The \"get\" method of the container instance", () => {

  describe("when it's executed", () => {

    describe("but the vertex hasn't been registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        expect(() => container.get("foo")).to.throw(Error, "foo hasn't been registered");
      });
    });

    describe("and a class vertex has been registered", () => {

      describe("without $inject or $compose list", () => {

        const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

        class One {
        }
        container.register("one", One);

        it("should return the instance of the class", () => {

          expect(container.get("one")).to.be.an.instanceOf(One);
        });
      });

      describe("and the class is supposed to be composed with", () => {

        describe("a talent", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            talentMethod() {}
          });

          class One {}
          One.$compose = ["talent"];
          container.register("talent", talent);
          container.register("one", One);

          it("should extend the returned instance with the specified talent", () => {

            const oneInstance = container.get("one");

            expect(oneInstance).to.include("talentMethod");
            expect(oneInstance.talentMethod).to.be.a.function();
            expect(oneInstance.talentMethod).to.be.be.equal(talent.talentMethod);
          });
        });

        describe("multiple talents", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent1 = Composer.createTalent({
            talentMethod1() {}
          });
          const talent2 = Composer.createTalent({
            talentMethod2() {}
          });

          class One {
            func() {}
          }
          One.$compose = ["talent1", "talent2"];
          container.register("talent1", talent1);
          container.register("talent2", talent2);
          container.register("one", One);

          it("should extend the returned instance with the specified talents", () => {

            const oneInstance = container.get("one");

            expect(oneInstance).to.include("talentMethod1");
            expect(oneInstance.talentMethod1).to.be.a.function();
            expect(oneInstance.talentMethod2).to.be.a.function();
            expect(oneInstance.talentMethod1).to.be.be.equal(talent1.talentMethod1);
            expect(oneInstance.talentMethod2).to.be.be.equal(talent2.talentMethod2);
          });
        });

        describe("a function as intended talent", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

          function nonValidTalent() {}
          class One {}
          One.$compose = ["nonValidTalent"];
          container.register("nonValidTalent", nonValidTalent);
          container.register("one", One);

          it("should throw an error", () => {

            expect(() => container.get("one"))
              .to.throw(Error, "The talent \"nonValidTalent\" has to be a talent created by the \"#createTalent\" method");
          });
        });

        describe("a talent but the talent is not registered", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

          class One {}
          One.$compose = ["talent"];
          // The talent is not registered
          container.register("one", One);

          it("should throw an error", () => {

            expect(() => container.get("one")).to.throw(Error, "The talent \"talent\" is not registered");
          });
        });

        describe("a talent but the compose list is not an array", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            talentMethod() {}
          });

          class One {}
          One.$compose = "talent"; // not an array
          container.register("talent", talent);
          container.register("one", One);

          it("should throw an error", () => {

            expect(() => container.get("one")).to.throw(Error, "The \"$compose\" list should be an array of strings");
          });
        });

        describe("a talent but the compose list is not an array of strings", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            talentMethod() {}
          });

          class One {}
          One.$compose = [talent]; // not an array of strings
          container.register("talent", talent);
          container.register("one", One);

          it("should throw an error", () => {

            expect(() => container.get("one")).to.throw(Error, "The \"$compose\" list should be an array of strings");
          });
        });

        describe("a talent with explicit alias type conflict resolution", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            toRename1() {},
            toRename2() {}
          });

          class One {}
          One.$compose = ["talent : toRename1 > renamed1, toRename2 > renamed2"];
          container.register("talent", talent);
          container.register("one", One);

          it("should apply the conflict resolutions and extend the instance", () => {

            const oneInstance = container.get("one");

            expect(oneInstance).to.include("renamed1");
            expect(oneInstance).to.include("renamed2");
            expect(oneInstance.renamed1).to.be.equal(talent.toRename1);
            expect(oneInstance.renamed2).to.be.equal(talent.toRename2);
          });
        });

        describe("a talent with explicit exclude type conflict resolution", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            toRemove1() {},
            toRemove2() {}
          });

          class One {}
          One.$compose = ["talent : toRemove1 -, toRemove2 -"];
          container.register("talent", talent);
          container.register("one", One);

          it("should apply the conflict resolutions and extend the instance", () => {

            const oneInstance = container.get("one");

            expect(oneInstance).to.not.include("toRemove1");
            expect(oneInstance).to.not.include("toRemove2");
          });
        });

        describe("a talent with explicit alias and exclude type conflict resolution", () => {

          const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
          const talent = Composer.createTalent({
            toRename1() {},
            toRename2() {},
            toRemove1() {},
            toRemove2() {}
          });

          class One {}
          One.$compose = ["talent : toRename1 > renamed1, toRename2 > renamed2, toRemove1 -, toRemove2 -"];
          container.register("talent", talent);
          container.register("one", One);

          it("should apply the conflict resolutions and extend the instance", () => {

            const oneInstance = container.get("one");

            expect(oneInstance).to.include("renamed1");
            expect(oneInstance).to.include("renamed2");
            expect(oneInstance.renamed1).to.be.be.equal(talent.toRename1);
            expect(oneInstance.renamed2).to.be.be.equal(talent.toRename2);

            expect(oneInstance).to.not.include("toRemove1");
            expect(oneInstance).to.not.include("toRemove2");
          });
        });
      });
    });

    describe("with extra parameters and a class vertex has been registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should return the instance of the class", () => {

        class One {
          constructor(dep1, dep2) {
            expect(dep1).to.equal("foo");
            expect(dep2).to.equal("bar");
          }
        }
        container.register("one", One);

        expect(container.get("one", "foo", "bar")).to.be.an.instanceOf(One);
      });
    });

    describe("and a function vertex has been registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      function one() {
        return "foo";
      }
      container.register("one", one);

      it("should return the instance of the class", () => {

        expect(container.get("one")).to.equal("foo");
      });
    });

    describe("with extra parameters and a function vertex has been registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should return the instance of the class", () => {

        function one(dep1, dep2) {
          expect(dep1).to.equal("foo");
          expect(dep2).to.equal("bar");
          return "foo";
        }
        container.register("one", one);

        expect(container.get("one", "foo", "bar")).to.equal("foo");
      });
    });

    describe("and a passthrough vertex has been registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);
      const globalData = {"foo": "bar"};

      container.register("one", globalData);

      it("should return the instance of the class", () => {

        expect(container.get("one")).to.equal(globalData);
      });
    });

    describe("on a \"straight\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should instantiate the class and its dependencies", () => {

        class Five {}

        class Four {
          constructor(five) {
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["five"];
          }
        }

        class Three {
          constructor(four) {
            expect(four).to.be.an.instanceOf(Four);
          }
          static get $inject() {
            return ["four"];
          }
        }

        class Two {
          constructor(three) {
            expect(three).to.be.an.instanceOf(Three);
          }
          static get $inject() {
            return ["three"];
          }
        }

        class One {
          constructor(two) {
            expect(two).to.be.an.instanceOf(Two);
          }
          static get $inject() {
            return ["two"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(container.get("one")).to.be.an.instanceOf(One);
      });
    });

    describe("on a \"short tree\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should instantiate the class and its dependencies", () => {

        class Two {}
        class Three {}
        class Four {}
        class Five {}

        class One {
          constructor(two, three, four, five) {
            expect(two).to.be.an.instanceOf(Two);
            expect(three).to.be.an.instanceOf(Three);
            expect(four).to.be.an.instanceOf(Four);
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["two", "three", "four", "five"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(container.get("one")).to.be.an.instanceOf(One);
      });
    });

    describe("on one kind of \"tall tree\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        class Two {}

        class One {
          constructor(two) {
            expect(two).to.be.an.instanceOf(Two);
          }
          static get $inject() {
            return ["two", "three"];
          }
        }

        class Four {}
        class Five {}

        class Three {
          constructor(four, five) {
            expect(four).to.be.an.instanceOf(Four);
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["four", "five"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(container.get("one")).to.be.an.instanceOf(One);
      });
    });

    describe("on an other kind of \"tall tree\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        class Four {}
        class Five {}

        class Two {
          constructor(four, five) {
            expect(four).to.be.an.instanceOf(Four);
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["four", "five"];
          }
        }

        class Three {}

        class One {
          constructor(two, three) {
            expect(two).to.be.an.instanceOf(Two);
            expect(three).to.be.an.instanceOf(Three);
          }
          static get $inject() {
            return ["two", "three"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(container.get("one")).to.be.an.instanceOf(One);
      });
    });

    describe("on a \"diamond\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should not throw an error", () => {

        class Five {}

        class Four {
          constructor(five) {
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["five"];
          }
        }

        class Two {
          constructor(four) {
            expect(four).to.be.an.instanceOf(Four);
          }
          static get $inject() {
            return ["four"];
          }
        }

        class Three {
          constructor(four) {
            expect(four).to.be.an.instanceOf(Four);
          }
          static get $inject() {
            return ["four"];
          }
        }

        class One {
          constructor(two, three) {
            expect(two).to.be.an.instanceOf(Two);
            expect(three).to.be.an.instanceOf(Three);
          }
          static get $inject() {
            return ["two", "three"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(container.get("one")).to.be.an.instanceOf(One);
      });
    });

    describe("on factorized vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should return whatever the function returns", () => {

        class One {}

        container.register("one", One);

        const oneFactory = container.get("oneFactory");

        expect(oneFactory.get()).to.be.an.instanceOf(One);
      });
    });

    describe("on factorized vertex", () => {

      const graph = new Graph(lifeCycles, modifiers);
      const container = new Container(graph, modifiers);

      it("should not change the type of the vertex - BUGFIX", () => {

        class One {}

        container.register("one", One);

        const vertexDataBefore = graph.getVertexData("one");

        expect(vertexDataBefore.type).to.equal("class"); // Checking before the act

        container.get("oneFactory");

        const vertexDataAfter = graph.getVertexData("one");

        expect(vertexDataAfter.type).to.equal("class"); // Checking after the act
      });
    });

    describe("on function vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should return whatever the function returns", () => {

        function one() {
          return "whatOneReturns";
        }

        container.register("one", one);
        expect(container.get("one")).to.be.equal("whatOneReturns");
      });
    });

    describe("on vertex which has a function dependency", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should inject whatever the function dependency return", () => {

        function two() {
          return "whatTwoReturns";
        }

        function one(twoResult) {
          expect(twoResult).to.equal("whatTwoReturns");
          return "whatOneReturns";
        }
        one.$inject = ["two"];

        container.register("one", one);
        container.register("two", two);
        expect(container.get("one")).to.be.equal("whatOneReturns");
      });
    });

    describe("on a passThrough vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should return the passThrough dependency", () => {

        const one = {"foo": "bar"};

        container.register("one", one);
        expect(container.get("one")).to.be.equal(one);
      });
    });

    describe("on a vertex which has passThrough dependency", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should inject the passThrough dependency", () => {

        const two = {"foo": "bar"};

        function one(twoInject) {
          expect(twoInject).to.equal(two);
          return "whatOneReturns";
        }
        one.$inject = ["two"];

        container.register("one", one);
        container.register("two", two);
        container.get("one");
      });
    });

    describe("\"cycled\" dependency graph", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        /* eslint-disable no-use-before-define */

        class Five {
          constructor(one) {
            expect(one).to.be.an.instanceOf(One);
          }
          static get $inject() {
            return ["one"];
          }
        }

        /* eslint-enable no-use-before-define */

        class Four {
          constructor(five) {
            expect(five).to.be.an.instanceOf(Five);
          }
          static get $inject() {
            return ["five"];
          }
        }

        class Three {
          constructor(four) {
            expect(four).to.be.an.instanceOf(Four);
          }
          static get $inject() {
            return ["four"];
          }
        }

        class Two {
          constructor(three) {
            expect(three).to.be.an.instanceOf(Three);
          }
          static get $inject() {
            return ["three"];
          }
        }

        class One {
          constructor(two) {
            expect(two).to.be.an.instanceOf(Two);
          }
          static get $inject() {
            return ["two"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);
        container.register("four", Four);
        container.register("five", Five);
        expect(() => container.get("one")).to.throw(Error, "A cycle has been detected");
      });
    });

    describe("on a dependency graph which has a \"perRequest\" vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      let four1Instance;
      let four2Instance;

      class Four {
        constructor() {
          this.fourInstance = "fourInstance";
        }
      }

      class Three {
        constructor(four) {
          four1Instance = four;
        }
        static get $inject() {
          return ["four"];
        }
      }

      class Two {
        constructor(four) {
          four2Instance = four;
        }
        static get $inject() {
          return ["four"];
        }
      }

      class One {
        constructor(two, three) {
          this.two = two;
          this.three = three;
        }
        static get $inject() {
          return ["two", "three"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four, "perRequest");

      it("should instantiate the \"perRequest\" dependency only once per request", () => {

        container.get("one");

        expect(four1Instance).to.equal(four2Instance);
      });
    });

    describe("on \"singleton\" registered vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      class One {
        constructor() {}
      }

      container.register("one", One, "singleton");

      it("should instantiate the vertex only once no matter how many request were made", () => {

        const request1 = container.get("one");
        const request2 = container.get("one");

        expect(request1).to.equal(request2);
      });
    });

    describe("on a dependency graph which has a \"unique\" vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      let four1Instance;
      let four2Instance;

      class Four {
        constructor() {
          this.fourInstance = "fourInstance";
        }
      }

      class Three {
        constructor(four) {
          four1Instance = four;
        }
        static get $inject() {
          return ["four"];
        }
      }

      class Two {
        constructor(four) {
          four2Instance = four;
        }
        static get $inject() {
          return ["four"];
        }
      }

      class One {
        constructor(two, three) {
          this.two = two;
          this.three = three;
        }
        static get $inject() {
          return ["two", "three"];
        }
      }

      container.register("one", One);
      container.register("two", Two);
      container.register("three", Three);
      container.register("four", Four, "unique");

      it("should instantiate the \"unique\" dependency every time when it's accessed in one request", () => {

        container.get("one");

        expect(four1Instance).to.be.an.instanceOf(Four);
        expect(four2Instance).to.be.an.instanceOf(Four);
        expect(four1Instance).to.not.shallow.equal(four2Instance); // Testing if they are the same reference
      });
    });

    describe("on \"unique\" registered vertex", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      class One {
        constructor() {}
      }

      container.register("one", One, "unique");

      it("should instantiate the vertex only once no matter how many requests were made", () => {

        const request1 = container.get("one");
        const request2 = container.get("one");

        expect(request1).to.be.an.instanceOf(One);
        expect(request2).to.be.an.instanceOf(One);
        expect(request1).to.not.shallow.equal(request2); // Testing if they are the same reference
      });
    });

    describe("on a vertex which has a factorized class dependency", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should not instantiate the vertex but inject a factory for that", () => {

        class Three {}

        class Two {
          constructor(three, param) {
            this.dependency = three;
            this.factorized = param;
          }
          static get $inject() {
            return ["three"];
          }
        }

        class One {
          constructor(twoFactory) {
            expect(twoFactory).to.be.an.object();
            expect(twoFactory).to.include("get");
            expect(twoFactory.get).to.be.a.function();

            const twoInstance = twoFactory.get(true);

            expect(twoInstance).to.include("dependency");
            expect(twoInstance.dependency).to.be.an.instanceOf(Three);
            expect(twoInstance).to.include({"factorized": true});
          }
          static get $inject() {
            return ["twoFactory"];
          }
        }

        container.register("one", One);
        container.register("two", Two);
        container.register("three", Three);

        container.get("one");
      });
    });

    describe("on a vertex which has a factorized function dependency", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        function two() {}

        class One {
          constructor() {
          }
          static get $inject() {
            return ["twoFactory"];
          }
        }

        container.register("one", One);
        container.register("two", two);

        expect(() => container.get("one")).to.throw(Error, "Only classes can be factorized");
      });
    });

    describe("on a vertex which has a factorized passThrough dependency", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should throw an error", () => {

        const two = {"foo": "bar"};

        class One {
          constructor() {}
          static get $inject() {
            return ["twoFactory"];
          }
        }

        container.register("one", One);
        container.register("two", two);

        expect(() => container.get("one")).to.throw(Error, "Only classes can be factorized");
      });
    });

    describe("on a vertex which has a optional dependency which is not registered", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should inject a null value", () => {

        class One {
          constructor(two) {
            expect(two).to.be.null();
          }
          static get $inject() {
            return ["two?"];
          }
        }

        container.register("one", One);

        container.get("one");
      });
    });

    describe("on a class vertex with an additional parameter", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should overload the constructor with that parameter", () => {

        const extraParam1 = "foo";
        const extraParam2 = "bar";

        class Two {}

        class One {
          constructor(two, overLoad1, overLoad2) {
            expect(overLoad1).to.equal(extraParam1);
            expect(overLoad2).to.equal(extraParam2);
          }
          static get $inject() {
            return ["two"];
          }
        }

        container.register("one", One);
        container.register("two", Two);

        container.get("one", extraParam1, extraParam2);
      });
    });

    describe("on a function vertex with an additional parameter", () => {

      const container = new Container(new Graph(lifeCycles, modifiers), modifiers);

      it("should overload the function with that parameter", () => {

        const extraParam1 = "foo";
        const extraParam2 = "bar";

        class Two {}

        function one(two, overLoad1, overLoad2) {
          expect(overLoad1).to.equal(extraParam1);
          expect(overLoad2).to.equal(extraParam2);
        }
        one.$inject = ["two"];

        container.register("one", one);
        container.register("two", Two);

        container.get("one", extraParam1, extraParam2);
      });
    });
  });
});
