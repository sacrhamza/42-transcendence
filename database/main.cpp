#include "include/conncpp/ResultSet.hpp"
# include <readline/history.h>
#include "sql_shell.hpp"
#include <mariadb/MariaDbDataSource.hpp>
#include <stdexcept>

bool signaled  = false;

class User {
  public:
    std::string mail,name,password;
  public:
    User(std::string name, std::string password, std::string mail) {
      if (mail.empty() || password.empty() || name.empty())
      {
        throw (std::runtime_error(""));
      }
      this->name = name;
      this->mail = mail;
      this->password = password;
    }

};



class DatabaseConnection {
  public:
    sql::Driver* driver;
    sql::SQLString url;
    sql::Statement*  stmnt;
    sql::Connection* conn;
  private:
    DatabaseConnection() {

      // Instantiate Driver
      driver = sql::mariadb::get_driver_instance();


      // Configure Connection
      // The URL or TCP connection string format is
      // ``jdbc:mariadb://host:port/database``.
      sql::SQLString url("jdbc:mariadb://127.0.0.1:3306/test");

      // Use a properties map for the other connection options
      sql::Properties properties({
          {"user", "codespace"},
          {"password", "codespace"},
          });


      conn = (driver->connect(url, properties));
      stmnt = (conn->createStatement());
    }

  public:
    static DatabaseConnection& getInstance() {
      static DatabaseConnection conn;
      return (conn);
    }
    ~DatabaseConnection() {
      delete stmnt;
      delete conn;
    }
};

void create_user(std::vector<std::string> cmds) {
  if (cmds.size() != 4) {
    throw (std::runtime_error(""));
  }
  try {
    User new_user(cmds[1], cmds[2], cmds[3]);
    DatabaseConnection& conn = DatabaseConnection::getInstance();
    sql::ResultSet *res = conn.stmnt->executeQuery("SELECT * from test WHERE name = '" + new_user.name + "';");
    // std::cout << res->next() << "\n";
    if (res->next())
      throw (std::runtime_error("name has taken"));
    // exit(20);
    std::cout << conn.stmnt->executeUpdate("insert into test values('" + new_user.name + "','" + new_user.mail + "','" + new_user.password + "');");
    std::cout << "done new user: " << new_user.name << "\n";
    delete res; 
  } catch (const std::exception& e) {
    std::cerr << e.what() << "\n";
  }
}


int main(void){
  // std::vector<string> res;
  // res = parse("/regster 'hamza' 'hamzaschool@gmail.com' 'mypassword' ");
  // for (vector<string>::iterator it = res.begin(); it != res.end();it++) {
  //   std::cout << "[" << *it << "]\n";
  // }


  DatabaseConnection& conn = DatabaseConnection::getInstance();

  // sql::ResultSet* result = conn.stmnt->executeQuery("SELECT * from test;");

  // if (!result->next())
  //   std::cout << "hy";
  // // std::cout << result->getString("id");
  // std::cout << result->isLast();
  // std::cout << result->isAfterLast();
  // std::cout << result->isBeforeFirst();
  // create_user(parse("/signup hamza hamza@mail.com hamza"));
  // delete result;
  // std::cout << result->getString("id");

  while (!signaled) {
    char* line = readline("sql-shell$ ");
    if (!line)
      break ;
    add_history(line);
    create_user(parse(line));
    // std::cout << line << "\n"; 
    free(line);
  }
  return (0);
}
