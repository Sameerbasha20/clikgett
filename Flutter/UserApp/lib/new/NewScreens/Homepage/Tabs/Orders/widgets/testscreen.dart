import 'package:flutter/material.dart';

class PopupListTileExample extends StatelessWidget {
  const PopupListTileExample({super.key});

  void _onMenuSelected(BuildContext context, String value) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Selected: $value")),
    );
  }

  void _showPopupMenu(BuildContext context, Offset offset) async {
    final RenderBox overlay =
        Overlay.of(context).context.findRenderObject() as RenderBox;

    await showMenu(
      context: context,
      position: RelativeRect.fromRect(
        offset & const Size(40, 40), // smaller rect, the touch point
        Offset.zero & overlay.size, // Bigger rect, the screen
      ),
      items: [
        const PopupMenuItem<String>(value: 'Option 1', child: Text('Option 1')),
        const PopupMenuItem<String>(value: 'Option 2', child: Text('Option 2')),
        const PopupMenuItem<String>(value: 'Option 3', child: Text('Option 3')),
        const PopupMenuItem<String>(value: 'Option 4', child: Text('Option 4')),
        const PopupMenuItem<String>(value: 'Option 5', child: Text('Option 5')),
      ],
      elevation: 8.0,
    ).then((value) {
      if (value != null) _onMenuSelected(context, value);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("ListTile PopupMenu")),
      body: ListView.builder(
        itemCount: 10,
        itemBuilder: (_, index) => GestureDetector(
          onTapDown: (TapDownDetails details) {
            _showPopupMenu(context, details.globalPosition);
          },
          child: ListTile(
            title: Text("Item ${index + 1}"),
            subtitle: const Text("Tap to open menu"),
            trailing: const Icon(Icons.more_vert),
          ),
        ),
      ),
    );
  }
}
