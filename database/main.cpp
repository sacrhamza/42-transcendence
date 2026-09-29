#include "sql_shell.hpp"
#include "./include/MariaDbDataSource.hpp"
#include <stdexcept>

bool signaled  = false;

class User {
	private:
		std::string mail,name,password;
	public:
		User(std::string mail, std::string password, std::string name) {
			if (mail.empty() || password.empty() || name.empty())
			{
				throw (std::runtime_error(""));
			}
		}

};

void create_user(std::vector<std::string> cmds) {
	if (cmds.size() != 5) {
		throw (std::runtime_error(""));
	}
	try {
		User new_user(cmds[1], cmds[2], cmds[3]);
	} catch (const std::exception& e) {
		
	}
}


int main(void){
	std::vector<string> res;
	res = parse("/regster 'hamza' 'hamzaschool@gmail.com' 'mypassword' ");
	for (vector<string>::iterator it = res.begin(); it != res.end();it++) {
		std::cout << "[" << *it << "]\n";
	}
	std::string method = getenv("REQUEST_METHOD");

	// Instantiate Driver
	sql::Driver* driver = sql::mariadb::get_driver_instance();

	// Configure Connection
	// The URL or TCP connection string format is
	// ``jdbc:mariadb://host:port/database``.
	sql::SQLString url("jdbc:mariadb://127.0.0.1:3306/names");

	// Use a properties map for the other connection options
	sql::Properties properties({
			{"user", "hamza"},
			{"password", "hamza"},
			});

	std::unique_ptr<sql::Connection> conn(driver->connect(url, properties));
	std::shared_ptr<sql::Statement>  stmnt(conn->createStatement());
	sql::ResultSet* result = stmnt->executeQuery("SELECT * from test;");

	std::cout << result->getString("id");

	// while (!signaled) {
	// 	char* line = readline("sql-shell$ ");
	// 	if (!line)
	// 		break ;
	// 	std::cout << line << "\n"; 
	// 	free(line);
	// }
	return (0);
}
