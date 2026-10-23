// This file is temporary, as it is being used for practing testing using Typescript

// First Note: run the command tsc sum.ts (or tsc sum.ts --ignoreConfig if you run into problems) to compile the Typescript code
//       this creates a .js/Javascript file under the same name as the Typescript file. Then run node <filename>, or node sum.ts
//       to get the code to run. However, this isn't running an actual test using a framework like Jest yet
// Second note: This test is an example test that uses Typescript found on the website 
// https://www.testim.io/blog/typescript-unit-testing-101/
function add(numbers: string): number {
    const integers = numbers.split(',').map(x => parseInt(x));
    const negatives = integers.filter(x => x < 0);

    if (negatives.length > 0)
        throw new RangeError('Negatives are not allowed: ' + negatives.join(', '));

    return integers
        .filter(x => x <= 1000)
        .reduce((a, b) => a + b, 0);
}

//Tests passing in multiple numbers in a string and adding all numbers together to get their sum
let result = add('1, 2, 4, 5');
console.log(result);

//Tests passing an empty string-should return 0
result = add('');
console.log(result);

//Tests passing in a single number-should return the number itself
result = add('2');
console.log(result);
// function add(numbers: string): number 
// {
//   let integers = numbers.split(',').map(x => parseInt(x));
//   let negatives = integers.filter(x => x < 0);

//   if(negatives.length > 0)
//     throw new RangeError('Negatives are not allowed: ' + negatives.join(', '));
  
//   return integers
//     .filter(x => x <= 1000)
//     .reduce((a, b) => a + b, 0);
// }

// let result = add('1, 2, 4, 5');
// console.log(result);