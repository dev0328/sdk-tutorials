---
title: "Go Introduction"
order: 
description: Get started with Golang
tag: deep-dive
---

# Go Introduction

Golang (Go) is an open source, statically typed and compiled programming language introduced by Google and first released in 2012. It has a BSD-style license. Its Git repository is located at [https://go.googlesource.com/go](https://go.googlesource.com/go).

Start with the basics. In this section, you install Go and learn some general things about it.

## Install

Installing Go depends on your machine. See the [Getting Started Page](https://golang.org/doc/install) and follow the instructions to install Go. 

<HighlightBox type="tip">

[gimme](https://github.com/travis-ci/gimme) is a useful script for Go.

</HighlightBox>

## Workflow

Go has a different workflow from most other programming tools. You will work with a single workspace and have all Go code contained in this workspace. The `GOPATH` environment variable specifies the location of your workspace. You can print it by typing `$ go env GOPATH` in your console. For more information about `GOPATH` type `$ go help gopath`. 

A version control system is helpful because you have one workspace. You should use Git for this.

## Hello World!

Let's start with the ever-popular "Hello, World!" program. Let's see, how it looks in Go:

```golang
package main
import "fmt"
func main() {
    fmt.Printf("Hello, World!\n")
}
```

[Test online](https://go.dev/play/p/1u5bSZlh80h)

Every Go program starts with the package declaration. Each package consists of one or more Go source files in a single directory. If the name of the package is `main`, Go creates an executable file.

After that, import the package `fmt`. Note that the package name is the last element of the package's file path. For an example, if you import the package "lib/math", then you use it as "math".

`fmt` implements input and output, and is part of Go's standard library. You are going to describe some of its functions later in more detail. 

Execution starts in the function called `main()`. 

This function simply calls the Go I/O function `Printf()` from the package `fmt`. 

<HighlightBox type="info">

Function names determine visibility outside of packages. `Printf`'s first character is upper case and this means it's visible outside of `fmt`. Packages' names are always written in lower case, like `fmt` (short for format). 

</HighlightBox>

Now, let's compile this program. Create the file `hello.go` in the `$GOPATH/src/hello` directory. In a terminal:

```
$ cd $GOPATH/src/hello
$ go build
```

If all goes well, `go` builds the executable. Go only prints errors. So, you should see no output and another command prompt unless something goes wrong.

Now test your programm:

```
./hello
```
Quick tip:

<HighlightBox type="info">

Go installs the executable in `$GOPATH/bin/` if you use `go install` instead of `go build`.

</HighlightBox>

<HighlightBox type="reading">

**Further readings:**

* [Go's Getting Started Page](https://golang.org/doc/install)
* [Understanding Golang Packages](https://thenewstack.io/understanding-golang-packages/)

</HighlightBox>