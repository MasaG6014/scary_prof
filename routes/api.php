use Illuminate\Support\Facades\Route;

Route::get('/hello', function () {
    return response()->json(['message' => 'hello world']);
});