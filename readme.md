# Nerdle Solver

The aim of this project is a fairly silly interactive html/javascript solver for https://nerdlegame.com/classic/

To try the automatic solver, you can run it from from your web browser here: https://tonybuk.github.io/NerdleSolver/

This is all performed in a self contained interactive webpage.  The idea is that the Nerdle Solver will generate a guess, you enter it into Nerdle itself, manually assign the colours back into the Nerdle Solver, and it will iterate guesses from there.

It goes without saying, this is 100% unaffiliated with Nerdle.  Currently it will only solve Nerdle Classic out of the box.  Adding support for Nerdle Pro isn't out of the question, but we'll see what the demand is.

So... how does this work?

Firstly, this needs to implement Nerdle itself, so I've essentially reverse engineered the parser by just throwing various inputs at it.  So here's some rules.

* Unary operators are allowed, and they stack, albeit I highly doubt they'll ever be used in any of the classic puzzles...
  * This means the following are 100% legal.

        --1+-1=0 (this reduces to: 1 - 1 = 0)
        +-+-1=+1 (this reduces to: 1     = 1)


* Leading zeroes are allowed, and there's no limit to them, albeit again, I highly doubt they'll ever be used in any of the classic puzzles...
  * This means the following are 100% legal.
  
        01*001=1 (this reduces to: 1 * 1 = 1)

* Otherwise standard Wordle rules apply.
  * Green on the guess means a number/operator is in the right position.
  * Green on the keyboard means at least one instance of the number/operator has been correctly deduced in the right position.
  * Purple on the guess means a number/operator is needed, but the position is wrong.
  * Purple on the keyboard means at least one instance of the number/operator is needed, but the exact position is unknown.
  * Black on the guess means this instance of the number/operator isn't needed.
    * If it's the *only* time this number/operator has been guessed in this round, then it isn't used anywhere.
    * If it's not the *only* time this number/operator has been guessed in this round, then it is needed, but this instance indicates we have too many.
  * Black on the keyboard means the number/operator is not used anywhere in the solution.

So as indicated, black on guesses is where things get interesting, as what it tells us is how *many* instances of a number/operator are needed.

Secondly, the part you're here for, the solver...

**Initial Game State**

Initially we know a few things, there's 8 entries, but we can rule reduce some already.

    Col : What we know...
    === : ===================================
      1 : Can only be one of 0123456789+-
      2 : Can only be one of 0123456789+-*/=
      3 : Can only be one of 0123456789+-*/=
      4 : Can only be one of 0123456789+-*/=
      5 : Can only be one of 0123456789+-*/=
      6 : Can only be one of 0123456789+-*/=
      7 : Can only be one of 0123456789+-*/=
      8 : Can only be one of 0123456789

We also know some things about the legal inputs:

    Input : What we know...
    ===== : ===================================
        0 : Can occur between 0 and 7 times
        1 : Can occur between 0 and 7 times
        2 : Can occur between 0 and 7 times
        3 : Can occur between 0 and 7 times
        4 : Can occur between 0 and 7 times
        5 : Can occur between 0 and 7 times
        6 : Can occur between 0 and 7 times
        7 : Can occur between 0 and 7 times
        8 : Can occur between 0 and 7 times
        9 : Can occur between 0 and 7 times
        + : Can occur between 0 and 5 times
        - : Can occur between 0 and 5 times
        * : Can occur between 0 and 3 times
        / : Can occur between 0 and 3 times
        = : Must occur only once

The interesting part that helps define this is the very last row.  Whilst we can position = in up to 6 positions, we know we can only have one of them.  We can also condense the operators further.  We know * and / must be nested between numbers, meaning for multiply/divide, the most you'll see is based on:

    0*0*0=00

Whereas because +/- can also be unary operators, it's 5 times, with the following being the longest legal expression:

    -----0=0

So any solutions proposed will be limited by the above knowledge.  We know what items can go in what positions, and we know a min/max for each.  The purpose of the solver therefore is once a solution is entered, use the colours returned to *refine* what we know about they game state, which will further reduce the potential solutions.

So each time a black entry is returned, we can refine two things:

* We can refine the maximum number of times an input can occur.
* We can refine the legal positions for the inputs since we know a position it *can't* go.
* And obviously if the maximum number of times is zero (i.e. input only tried once, and black was returned), we can remove it entirely from consideration.

Each time a purple entry is returned, we can refine two things:

* We can refine the minimum number if tunes an input can occur.
* We can refine the legal positions for the inputs since we know a position it *can't* go.

Each time a green entry is returned, we can again refine two things:

* We can refine the minimum number if tunes an input can occur.
* We can refine the legal inputs for a given position since we know what it *must* be.

The idea is we want to end up with a scenario where:

* All the min/max's are the same, meaning we know exactly how many times each input is used.
* All the positions have exactly one entry, meaning we know exactly what input is used in what position.

The closer we get to achieving this, the less possible permutations there are that satisfy a balanced equation.

In terms of the balanced equation, we need to find an equation that meets the known criteria:

* All known positions are filled with the input.
* All unknown positions are filled with the possible inputs.
* The total of each of the inputs that are used/not used all satisfy the known ranges for each input.
* If possible, avoid solutions which abuse stacking unary +/- and leading zeroes, these will only be used if all other possibilities have been eliminated.
* If possible, avoid solutions which abuse multiplying by zero, these will only be used if all other possibility have been eliminated.

** Remaining Work **

So this basically works for the data I've tried to date, but I'll be feeding this data on attrition to see where it falls over.  Also, I'm interested in whether this should always guess 0+12/3=4 on the second pass unless it's got more than X% of correct data, as so far, this typically solves one guess sooner...

Obviously please share any games where this falls over so I can investigate... just super duper 100% double check you entered the data correctly first!
