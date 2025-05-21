<?php
	
	class DB {
	    protected static $instance;

	    public static function getInstance() {
	        if (empty(self::$instance)) {
	            $host = "localhost";
	            $dbname = "bocadillo";
	            $user = "root";
	            $password = "";

	            try {
	                self::$instance = new PDO("mysql:host=$host;dbname=$dbname", $user, $password);
	                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	                self::$instance->query('SET NAMES utf8');
	            } catch (PDOException $e) {
	                echo json_encode([
	                    'success' => false,
	                    'message' => 'Error en la conexión a la base de datos: ' . $e->getMessage()
	                ]);
	                exit;
	            }
	        }

	        return self::$instance;
	    }
	}



?>