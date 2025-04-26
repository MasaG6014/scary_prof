<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;    

class SecretSharingController extends Controller
{
    public function getShares(Request $request)
    {
        $data = $request->all();
        $score = intval($data["score"]);
        $numOfShares = intval($data["numOfShares"]);
        return response()->json($data);
    }
}
