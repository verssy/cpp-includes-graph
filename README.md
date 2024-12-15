# cpp-includes-graph README

## Features

This extension is useful if you want to remove some unnecessary header dependencies from your sources (if they were already included in headers above)

As an example, if you have project with such structure:
```
folder
 |- c.hpp
main.cpp
a.hpp
```
and files consist of:

main.cpp:
```c++
#include "a.hpp"

#include <iostream>

int main()
{
    // ...
}
```

a.hpp:
```c++
#pragma once

#include "folder/c.hpp"

#include <iostream>
// ...
```

folder/c.hpp:
```c++
#pragma once

#include <iostream>
// ...
```

Then resulting dependency graph will look something like this:

![Initial-Image](https://github.com/verssy/cpp-includes-graph/blob/main/images/initial-graph.png)

So, you can delete `#include <iostream>` from `a.hpp` and `main.cpp` and the program will not have redundant dependencies:

![Initial-Image](https://github.com/verssy/cpp-includes-graph/blob/main/images/reduced-graph.png)

## Usage

1. Open some source or header C++ file
2. Press `Ctrl+Shift+P`
3. Type `Analyze C++ Includes`
4. Press `Enter`
