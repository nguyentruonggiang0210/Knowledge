using Microsoft.AspNetCore.Mvc;
using TvWeb.Data;

namespace TvWeb.Controllers;

public class HomeController : Controller
{
    private readonly AppDb _db;
    public HomeController(AppDb db) => _db = db;

    public async Task<IActionResult> Index()
    {
        var films = await _db.LatestAsync(24);
        var hero = films.Take(5).ToList();
        return View((hero, films));
    }

    public IActionResult Error() => View();
}
