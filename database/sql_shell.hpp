#ifndef _SQL_SHELL_H
#define _SQL_SHELL_H

#include <exception>
#include <iostream>
#include <utility>
#include <vector>
#include <algorithm>
#include <readline/readline.h>


using namespace std;

std::vector<string> parse(const std::string &line);

#endif


