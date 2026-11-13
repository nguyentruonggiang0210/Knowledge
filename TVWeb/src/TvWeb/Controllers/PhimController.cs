using Microsoft.AspNetCore.Mvc;
using TvWeb.Data;

namespace TvWeb.Controllers;

[Route("phim")]
public class PhimController : Controller
{
    private readonly AppDb _db;
    public PhimController(AppDb db) => _db = db;

    [HttpGet("")]
    public async Task<IActionResult> Index(string? q, string? genre, string? status, int page = 1, int size = 24)
    {
        page = Math.Max(1, page);
        var films = await _db.SearchAsync(q, genre, status, page, size);
        var total = await _db.CountAsync(q, genre, status);
        ViewBag.Genres = await _db.GenresAsync();
        ViewBag.Query = q; ViewBag.Genre = genre; ViewBag.Status = status;
        ViewBag.Page = page; ViewBag.Size = size; ViewBag.Total = total;
        return View(films);
    }

    [HttpGet("{slug}")]
    public async Task<IActionResult> Details(string slug)
    {
        var film = await _db.GetFilmAsync(slug);
        if (film == null) return NotFound();
        return View((film, await _db.GetEpisodesAsync(slug)));
    }

    // /xem-phim/{slug}?server=..&ep=..
    [HttpGet("/xem-phim/{slug}")]
    public async Task<IActionResult> Xem(string slug, string? server, string? ep)
    {
        var film = await _db.GetFilmAsync(slug);
        if (film == null) return NotFound();
        var episodes = await _db.GetEpisodesAsync(slug);
        if (episodes.Count == 0) return View("NoSource", film);
        var current = episodes.FirstOrDefault(e => e.ServerSlug == server && e.EpIndex == ep)
            ?? episodes.FirstOrDefault(e => e.ServerSlug == server)
            ?? episodes[0];
        ViewBag.Servers = episodes.Select(e => e.ServerSlug).Distinct().ToList();
        ViewBag.Server = current.ServerSlug;
        return View((film, episodes, current));
    }
}
