const person = {
  name: 'John Cena',
  greet: function () {
    console.log(`Hello, I'm ${this.name}`);
  }
};

setTimeout(person.greet.bind(person), 500)

const person1 = {
  name: 'John Cena',
  greet: function () {
    const self = this
    const inner = () => {
      console.log(`Hello, I'm ${this.name}`);
    }
    inner()
  }
}

person1.greet()

Function.prototype.myCall = function(context, ...args) {
  context = context || (typeof window !== 'undefined' ? window : global);
  
  const fnSymbol = Symbol('fn');
  console.log({fnSymbol})
  context[fnSymbol] = this;
  console.log({context})
  
  const result = context[fnSymbol](...args);
  
  delete context[fnSymbol];
  
  return result;
};

const person2 = {
  name: 'John Cena 2'
}

function logName () {
  console.log(`I am ${this.name}`)
}

logName.myCall(person2)