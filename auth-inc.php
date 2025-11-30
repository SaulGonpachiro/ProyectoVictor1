<?php
session_start();

if (!isset($_SESSION['email']) || empty($_SESSION['email'])){
    $salida["succes"] = false;
    $salida["logged"] = false;
    $salida["msg"] = "El usuario no tiene sesión";

    echo json_encode($salida);
}