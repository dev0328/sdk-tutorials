---
title: "Arrays and Slices in Go"
order: 
description: 
tag: deep-dive
---

# Arrays and Slices in Go

In this section, arrays and slices are introduced.

## Arrays

In Go, the size of an array is a part of the type. So, arrays have a fixed size. The declaration has the syntax:

```golang
var array [size]type
```

You can access the data with `array[index]`. Let's do a cross product:

```golang
package main
import (
    "fmt"
)
func main() {
    v1 := [3]float64{7, 5, 4}
    var v2 [3]float64
    v2 = [3]float64{2, 4, 6}
    for v3,i := [...]float64{0, 0, 0}, 0; i < len(v3); i++ {
        v3[i] = v1[(i + 1) % 3] * v2[(i + 2) % 3] - v1[(i + 2) % 3] * v2[(i + 1) % 3]
        defer fmt.Printf("%t\n", v3)
    }
}
```

<HighlightBox type="tip">

[Test it online](https://go.dev/play/p/dHKzLGNNjxC).

</HighlightBox>

As you can see, the compiler fits the array depending on the number of elements. 

We have the built-in function `len(array)`, which gives the size of an array. Note, the example code is not well-written, but it shows you different aspects of arrays. 

We use `defer`, which means defer the execution in last-in-first-out order until surrounding functions return.

## Slices

In Go, a *slice* is a an abstraction built on top of arrays. They are more flexible than arrays. You will see slices used more often than arrays because of this flexbility. 

A slice does not have a fixed size. To declare a slice:

```golang
var slice []type
```

A slice has a length(`len(slice)`) and a capacity(`cap(slice)`). You can also use a built-in function to declare a slice: `func make([]type, length, capacity) []type`. It returns a slice with the given length, capacity and type. It allocates an array, which is referred to by the returned slice.

Let's create a simple slice with three vectors and then add a vector with the built-in `func append(s []T, vs ...T) [] T` function:

```golang
package main
import "fmt"
func main() {
    vectors := []struct {
        x,y,z float64
    } {
        { 1, 2, 3 },
        { 3.2, 4, 6 },
        { 4, 3, 1},
    }
    fmt.Printf("type %#T and value %v\n", vectors, vectors)
    vectors = append(vectors, struct{ x, y, z float64 }{ 7, 7, 7 })
    fmt.Printf("type %#T and value %v\n", vectors[3:], vectors[3:])
    fmt.Printf("type %#T and value %v\n", vectors[3], vectors[3])
    for i, v := range vectors {
        fmt.Println(i, " : ", v)
    }
    numbers := make([]int, 10, 10) // create a slice with an underlying array
    fmt.Println(numbers)
    for i := range numbers {
        numbers[i] = i
    }
    fmt.Println(numbers)
}
```

<HighlightBox type="tip">

[Test it online](https://go.dev/play/p/T8Ppscz5YjO).

</HighlightBox>

As you can see, we are just playing here.

One can use `range` to iterate over an array, slice or map. `i` is the index and `v` is the value of that index.

There is also a built-in `func copy(dst, src []T) int` to copy a slice into another and return the number of copied elements.

## Maps

Maps are stored key/value pairs. The declaration is:

```golang
var m map[keyType]valueType
```

But that creates a `nil` map, which is not so useful. You can read such a map but not write. We will use `make` to initialize a map so we can write to it. This is more useful:

```golang
m := make(map[keyType]valueType)
```

Let's play with maps:

```golang
package main
import "fmt"
func main() {
    age := map[string]int {"max": 24, "tom": 28}
    fmt.Println("map:", age)
    m := make(map[string]float64)
    m["E"]  = 2.7182818284
    m["Pi"] = 3.1415926535
    m["Phi"]= 1.6180339887
    
    for key, v := range m {
        fmt.Printf("Key: %v, Value: %v, Value: %v \n", key, v, m[key])
    }
    delete(m, "E") // does not return anything. It does nothing, if the key does not exist.
    fmt.Println("len:", len(m))
    fmt.Println("map:", m)
    
    _, ok := m["E"] // does the key exists?
    fmt.Println("ok:", ok)
}
```

<HighlightBox type="tip">

[Test it online](https://go.dev/play/p/1Ny9l13nHUg).

</HighlightBox>

The built-in function `func delete(m map[Type]Type1, key Type)` deletes the element with the key from the map. 

<HighlightBox type="warn">

When iterating over maps, order is not deterministic. 

</HighlightBox>

<HighlightBox type="reading">

**Further reading:**

* [Go Slices](https://blog.golang.org/go-slices-usage-and-internals)

</HighlightBox>