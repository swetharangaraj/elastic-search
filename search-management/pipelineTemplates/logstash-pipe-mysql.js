exports.template = `input {
    
    jdbc{
        jdbc_connection_string => "jdbc:mysql://[mysql_host]/[database]?zeroDateTimeBehavior=convertToNull"
        jdbc_user => "[mysqlUser]"
        jdbc_password => "[mysqlPass]"
        jdbc_driver_library => "/usr/share/logstash/jdbc-connector/mysql-connector-java-8.0.28/mysql-connector-java-8.0.28.jar"
        jdbc_driver_class => "com.mysql.jdbc.Driver"
        use_column_value => true
        clean_run => true
        tracking_column_type => "numeric"
        tracking_column => "unix_ts_in_secs"
        jdbc_paging_enabled => true
        schedule => "* * * * *"
        statement => "SELECT [columns],UNIX_TIMESTAMP(changed_on) AS unix_ts_in_secs FROM [table] where (UNIX_TIMESTAMP(changed_on) > :sql_last_value AND changed_on < NOW() AND is_active = 1) order by changed_on ASC"

    }

    }
filter{
  mutate {
        copy => { "[primary_key]" => "[@metadata][_id]"}
        remove_field => ["[primary_key]", "@version", "unix_ts_in_secs"]
        add_field => { "index_alias_name" => "[index_alias_name]" }
    }
}

output {
    stdout { codec =>  "rubydebug"}

    elasticsearch {
    cloud_id => "[cloud_id]"
    ssl => true
    ilm_enabled => false
    user => "[elastic_user]"
    password => "[elastic_password]"
    index => "[index_name]"
    document_id => "%{[@metadata][_id]}"
  }
}`;
