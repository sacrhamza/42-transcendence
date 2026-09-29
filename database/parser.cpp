#include "sql_shell.hpp"


std::vector<string> parse(const std::string &line) {

	std::vector<string> res;
	size_t end = 0;
	size_t start = 0;
	std::string token;
	string spaces = "\t\r\n ";
	std::string quotes = "\'\"";

	while (end < line.length()) {

		if (line[end] == ' ') {
			res.push_back(token);
			token.clear();
			end = line.find_first_not_of(spaces, end);
		}
		else if (line[end] == '\''  || line[end] == '\"') {
			start = end + 1;
			end = line.find_first_of(line[end], end + 1);
			if (end == string::npos) {
				throw (std::exception());
			}
			token += line.substr(start, end - start);
			end++;
		}
		else {
			start = end;
			end = line.find_first_of(spaces + quotes, end);
			token += line.substr(start, end - start);
			if (end == string::npos)
				res.push_back(token);
		}
	}
	return (res);
}
