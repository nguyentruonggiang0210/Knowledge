using Microsoft.AspNetCore.Mvc;
using TvWeb.Data;

namespace TvWeb.Controllers;

[Route("api")]
[ApiController]
public class ApiController : ControllerBase
{
    private readonly AppDb _db;
    public ApiController(AppDb db) => _db = db;

    [HttpGet("phims/moi")]
    public async Task<IActionResult> Moi([FromQuery] int take = 24) =>
        Ok(await _db.LatestAsync(Math.Clamp(take, 1, 100)));

    [HttpGet("phim/{slug}")]
    public async Task<IActionResult> ChiTiet(string slug)
    {
        var f = await _db.GetFilmAsync(slug);
        if (f == null) return NotFound();
        return Ok(new { film = f, episodes = await _db.GetEpisodesAsync(slug) });
    }
}
