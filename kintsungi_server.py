from web.app import app


if __name__ == "__main__":
    import os

    app.run(
        host="127.0.0.1",
        port=int(os.environ.get("PORT", "5000")),
        debug=os.environ.get("KINTSUNGI_DEBUG", "0") == "1",
    )
